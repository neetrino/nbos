import { Logger } from '@nestjs/common';
import type { ClientServiceType, Prisma, PrismaClient } from '@nbos/database';
import {
  CLIENT_SERVICE_INVOICE_OVERDUE_GRACE_DAYS,
  CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS,
} from './client-service-payment-stage';
import { clientServiceInvoiceType, requirePositiveAmount } from './client-service-flow-helpers';
import type { ClientServiceFlowsService } from './client-service-flows.service';

const logger = new Logger('ClientServicesRenewalInvoice');

const INACTIVE_INVOICE_STATUSES = ['PAID', 'CANCELLED'] as const;
const INACTIVE_EXPENSE_STATUSES = ['PAID', 'CANCELLED'] as const;

export interface ClientServicesRenewalInvoiceParams {
  asOf?: string;
}

export interface ClientServicesRenewalInvoiceResult {
  asOf: string;
  eligibleCount: number;
  skippedExisting: number;
  created: Array<{ serviceId: string; invoiceId: string }>;
  failures: Array<{ serviceId: string; message: string }>;
}

type PrismaLike = Pick<PrismaClient, 'clientServiceRecord'>;

interface ServiceRow {
  id: string;
  projectId: string;
  type: ClientServiceType;
  name: string;
  renewalDate: Date | null;
  clientCharge: unknown;
  invoices: Array<{ moneyStatus: string; dueDate: Date | null; createdAt: Date }>;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseAsOfOptional(asOf?: string): Date {
  if (!asOf?.trim()) {
    return new Date();
  }
  const parsed = new Date(asOf.trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid asOf; use an ISO-8601 date or datetime.');
  }
  return parsed;
}

/** Prisma filter for WE_PAY services approaching `renewal_date` (EXP-04 / Finance canon). */
export function buildRenewalInvoiceEligibleWhere(
  now: Date = new Date(),
): Prisma.ClientServiceRecordWhereInput {
  const invoiceWindowEnd = addDays(now, CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS);
  return {
    billingModel: 'WE_PAY',
    status: { not: 'CANCELLED' },
    renewalDate: { not: null, lte: invoiceWindowEnd },
    expenses: { none: { status: { notIn: [...INACTIVE_EXPENSE_STATUSES] } } },
  };
}

/**
 * True when a non-cancelled invoice already covers this renewal period
 * (active invoice, or paid invoice created inside the renewal window).
 */
export function hasInvoiceForRenewalPeriod(
  invoices: readonly { moneyStatus: string; createdAt?: Date | null; dueDate?: Date | null }[],
  renewalDate: Date,
  windowDays: number = CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS,
): boolean {
  const windowStartMs = addDays(renewalDate, -windowDays).getTime();
  const renewalEndMs = renewalDate.getTime();

  for (const invoice of invoices) {
    if (invoice.moneyStatus === 'CANCELLED') continue;

    const isActive = !(INACTIVE_INVOICE_STATUSES as readonly string[]).includes(
      invoice.moneyStatus,
    );
    if (isActive) return true;

    if (invoice.moneyStatus === 'PAID') {
      if (!invoice.createdAt) return true;
      const createdMs = invoice.createdAt.getTime();
      if (createdMs >= windowStartMs && createdMs <= renewalEndMs) {
        return true;
      }
    }
  }
  return false;
}

/** Daily scheduler: create pass-through Invoice Cards for due WE_PAY client services. */
export async function runClientServicesRenewalInvoices(
  prisma: PrismaLike,
  flows: ClientServiceFlowsService,
  params: ClientServicesRenewalInvoiceParams = {},
): Promise<ClientServicesRenewalInvoiceResult> {
  const asOf = parseAsOfOptional(params.asOf);
  const where = buildRenewalInvoiceEligibleWhere(asOf);

  const services = await prisma.clientServiceRecord.findMany({
    where,
    orderBy: { renewalDate: 'asc' },
    select: {
      id: true,
      projectId: true,
      type: true,
      name: true,
      renewalDate: true,
      clientCharge: true,
      invoices: {
        where: { moneyStatus: { not: 'CANCELLED' } },
        select: { moneyStatus: true, dueDate: true, createdAt: true },
      },
    },
  });

  const created: ClientServicesRenewalInvoiceResult['created'] = [];
  const failures: ClientServicesRenewalInvoiceResult['failures'] = [];
  let skippedExisting = 0;

  for (const row of services) {
    const renewalDate = row.renewalDate;
    if (!renewalDate) continue;

    if (hasInvoiceForRenewalPeriod(row.invoices, renewalDate)) {
      skippedExisting += 1;
      continue;
    }

    try {
      const invoiceId = await createRenewalInvoice(flows, row, asOf);
      created.push({ serviceId: row.id, invoiceId });
      logger.log(`Created renewal invoice ${invoiceId} for client service ${row.id}`);
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Unknown error creating invoice';
      failures.push({ serviceId: row.id, message });
      logger.warn(`Skipped client service ${row.id}: ${message}`);
    }
  }

  return {
    asOf: asOf.toISOString(),
    eligibleCount: services.length,
    skippedExisting,
    created,
    failures,
  };
}

async function createRenewalInvoice(
  flows: ClientServiceFlowsService,
  row: ServiceRow,
  asOf: Date,
): Promise<string> {
  const amount = requirePositiveAmount(Number(row.clientCharge), 'Invoice amount');
  const invoice = await flows.createInvoice(row.id, {
    amount,
    type: clientServiceInvoiceType(row.type),
    dueDate: addDays(asOf, CLIENT_SERVICE_INVOICE_OVERDUE_GRACE_DAYS).toISOString(),
  });
  return invoice.id;
}
