import { Logger } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import {
  CLIENT_SERVICE_RENEWAL_EXPENSE_WINDOW_DAYS,
  CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS,
} from './client-service-payment-stage';
import { hasInvoiceForRenewalPeriod } from './client-services-renewal-invoice';
import { ensureExpenseForPaidInvoice } from './client-paid-invoice-expense';
import type { ClientServiceFlowsService } from './client-service-flows.service';
import {
  matchExpenseForPaidInvoice,
  type CycleExpenseRow,
} from './domain-purchase/domain-expense-cycle';

const logger = new Logger('ClientServicesRenewalExpense');

const OPEN_INVOICE_STATUSES = ['NEW', 'AWAITING_PAYMENT', 'OVERDUE', 'ON_HOLD'] as const;

export interface ClientServicesRenewalExpenseParams {
  asOf?: string;
  serviceId?: string;
}

export interface ClientServicesRenewalExpenseResult {
  asOf: string;
  eligibleCount: number;
  skippedExisting: number;
  created: Array<{ serviceId: string; invoiceId: string; expenseId: string }>;
  failures: Array<{ serviceId: string; message: string }>;
}

type PrismaLike = Pick<PrismaClient, 'clientServiceRecord' | 'expense'>;

interface CycleInvoice {
  id: string;
  moneyStatus: string;
  createdAt: Date;
  dueDate: Date | null;
  amount: unknown;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseAsOfOptional(asOf?: string): Date {
  if (!asOf?.trim()) return new Date();
  const parsed = new Date(asOf.trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid asOf; use an ISO-8601 date or datetime.');
  }
  return parsed;
}

export function buildRenewalExpenseEligibleWhere(
  now: Date = new Date(),
  serviceId?: string,
): Prisma.ClientServiceRecordWhereInput {
  const expenseWindowEnd = addDays(now, CLIENT_SERVICE_RENEWAL_EXPENSE_WINDOW_DAYS);
  return {
    ...(serviceId ? { id: serviceId } : {}),
    billingModel: 'WE_PAY',
    status: { not: 'CANCELLED' },
    renewalDate: { not: null, lte: expenseWindowEnd },
  };
}

export function findRenewalCycleInvoice(
  invoices: readonly CycleInvoice[],
  renewalDate: Date | null,
): CycleInvoice | undefined {
  const open = invoices.find((invoice) =>
    (OPEN_INVOICE_STATUSES as readonly string[]).includes(invoice.moneyStatus),
  );
  if (open) return open;
  if (!renewalDate) return undefined;
  if (
    !hasInvoiceForRenewalPeriod(invoices, renewalDate, CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS)
  ) {
    return undefined;
  }
  return invoices.find((invoice) => invoice.moneyStatus === 'PAID');
}

/** Daily catch-up: create the renewal Expense at the first of Invoice Paid or D−30. */
export async function runClientServicesRenewalExpenses(
  prisma: PrismaLike,
  flows: ClientServiceFlowsService,
  params: ClientServicesRenewalExpenseParams = {},
): Promise<ClientServicesRenewalExpenseResult> {
  const asOf = parseAsOfOptional(params.asOf);
  const services = await prisma.clientServiceRecord.findMany({
    where: buildRenewalExpenseEligibleWhere(asOf, params.serviceId),
    orderBy: { renewalDate: 'asc' },
    select: {
      id: true,
      name: true,
      ourCost: true,
      renewalDate: true,
      invoices: {
        where: { moneyStatus: { not: 'CANCELLED' } },
        select: { id: true, moneyStatus: true, createdAt: true, dueDate: true, amount: true },
      },
    },
  });

  const created: ClientServicesRenewalExpenseResult['created'] = [];
  const failures: ClientServicesRenewalExpenseResult['failures'] = [];
  let skippedExisting = 0;

  for (const row of services) {
    const outcome = await applyRenewalExpenseForService(prisma, flows, row, asOf);
    if (outcome.kind === 'created') {
      created.push(outcome.row);
      continue;
    }
    if (outcome.kind === 'skipped') {
      skippedExisting += 1;
      continue;
    }
    if (outcome.kind === 'failed') {
      failures.push({ serviceId: row.id, message: outcome.message });
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

async function applyRenewalExpenseForService(
  prisma: PrismaLike,
  flows: ClientServiceFlowsService,
  row: {
    id: string;
    name: string;
    ourCost: unknown;
    renewalDate: Date | null;
    invoices: CycleInvoice[];
  },
  asOf: Date,
): Promise<
  | { kind: 'none' }
  | { kind: 'skipped' }
  | { kind: 'created'; row: ClientServicesRenewalExpenseResult['created'][number] }
  | { kind: 'failed'; message: string }
> {
  const cycleInvoice = findRenewalCycleInvoice(row.invoices, row.renewalDate);
  if (!cycleInvoice) return { kind: 'none' };

  const expenses = await prisma.expense.findMany({
    where: { clientServiceRecordId: row.id },
    select: { id: true, sourceInvoiceId: true, dueDate: true, status: true, notes: true },
  });
  const match = matchExpenseForPaidInvoice({
    invoiceId: cycleInvoice.id,
    paidAt: cycleInvoice.moneyStatus === 'PAID' ? cycleInvoice.createdAt : asOf,
    expenses: expenses as CycleExpenseRow[],
  });
  if (match.kind === 'linked' || match.kind === 'ambiguous') return { kind: 'skipped' };

  try {
    const expenseId = await ensureExpenseForPaidInvoice(prisma, flows, {
      invoiceId: cycleInvoice.id,
      invoiceAmount: cycleInvoice.amount,
      paidDate: cycleInvoice.moneyStatus === 'PAID' ? cycleInvoice.createdAt : asOf,
      service: {
        id: row.id,
        name: row.name,
        ourCost: row.ourCost,
        renewalDate: row.renewalDate,
      },
    });
    if (!expenseId) return { kind: 'skipped' };
    if (match.kind === 'reuse') return { kind: 'skipped' };
    return {
      kind: 'created',
      row: { serviceId: row.id, invoiceId: cycleInvoice.id, expenseId },
    };
  } catch (caught: unknown) {
    const message = caught instanceof Error ? caught.message : 'Unknown error creating expense';
    logger.warn(`Skipped client service ${row.id}: ${message}`);
    return { kind: 'failed', message };
  }
}
