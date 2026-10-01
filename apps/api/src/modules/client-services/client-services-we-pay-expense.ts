import { Logger } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import { CLIENT_SERVICE_RENEWAL_EXPENSE_WINDOW_DAYS } from './client-service-payment-stage';
import type { ClientServiceFlowsService } from './client-service-flows.service';
import type {
  ClientServicesRenewalExpenseParams,
  ClientServicesRenewalExpenseResult,
} from './client-services-renewal-expense';

const logger = new Logger('ClientServicesWePayExpense');
const PAID_EXPENSE_STATUS = 'PAID';

type PrismaLike = Pick<PrismaClient, 'clientServiceRecord' | 'expense'>;
type ExpenseWriter = Pick<ClientServiceFlowsService, 'createExpense'>;

interface WePayServiceRow {
  id: string;
  name: string;
  ourCost: unknown;
  renewalDate: Date | null;
}

interface CycleExpense {
  status: string;
  dueDate: Date | null;
}

type ApplyOutcome =
  | { kind: 'none' }
  | { kind: 'skipped' }
  | { kind: 'created'; row: ClientServicesRenewalExpenseResult['created'][number] }
  | { kind: 'failed'; message: string };

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseAsOf(asOf?: string): Date {
  if (!asOf?.trim()) return new Date();
  const parsed = new Date(asOf.trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid asOf; use an ISO-8601 date or datetime.');
  }
  return parsed;
}

function sameUtcDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

/** Open expense, or a paid expense already dated on this renewal day. */
export function wePayCycleExpenseExists(
  expenses: readonly CycleExpense[],
  renewalDate: Date,
): boolean {
  return expenses.some((row) => matchesWePayCycle(row, renewalDate));
}

function matchesWePayCycle(row: CycleExpense, renewalDate: Date): boolean {
  if (row.status === 'CANCELLED') return false;
  if (row.status !== PAID_EXPENSE_STATUS) return true;
  return row.dueDate != null && sameUtcDay(row.dueDate, renewalDate);
}

export function buildWePayExpenseWhere(
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

/** Daily pass: Expense for We Pay inside D−30. No invoice. */
export async function runWePayRenewalExpenses(
  prisma: PrismaLike,
  flows: ExpenseWriter,
  params: ClientServicesRenewalExpenseParams = {},
): Promise<ClientServicesRenewalExpenseResult> {
  const asOf = parseAsOf(params.asOf);
  const services = await prisma.clientServiceRecord.findMany({
    where: buildWePayExpenseWhere(asOf, params.serviceId),
    orderBy: { renewalDate: 'asc' },
    select: { id: true, name: true, ourCost: true, renewalDate: true },
  });
  return collectWePayExpenses(prisma, flows, services, asOf);
}

async function collectWePayExpenses(
  prisma: PrismaLike,
  flows: ExpenseWriter,
  services: WePayServiceRow[],
  asOf: Date,
): Promise<ClientServicesRenewalExpenseResult> {
  const created: ClientServicesRenewalExpenseResult['created'] = [];
  const failures: ClientServicesRenewalExpenseResult['failures'] = [];
  let skippedExisting = 0;

  for (const row of services) {
    const outcome = await applyWePayExpense(prisma, flows, row);
    if (outcome.kind === 'created') created.push(outcome.row);
    if (outcome.kind === 'skipped') skippedExisting += 1;
    if (outcome.kind === 'failed') failures.push({ serviceId: row.id, message: outcome.message });
  }

  return {
    asOf: asOf.toISOString(),
    eligibleCount: services.length,
    skippedExisting,
    created,
    failures,
  };
}

async function applyWePayExpense(
  prisma: PrismaLike,
  flows: ExpenseWriter,
  row: WePayServiceRow,
): Promise<ApplyOutcome> {
  if (!row.renewalDate) return { kind: 'none' };
  const expenses = await prisma.expense.findMany({
    where: { clientServiceRecordId: row.id },
    select: { status: true, dueDate: true },
  });
  if (wePayCycleExpenseExists(expenses, row.renewalDate)) return { kind: 'skipped' };

  const amount = Number(row.ourCost);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { kind: 'failed', message: 'No provider amount' };
  }

  try {
    const expense = await flows.createExpense(row.id, {
      amount,
      dueDate: row.renewalDate.toISOString(),
      status: 'DUE_NOW',
    });
    return {
      kind: 'created',
      row: { serviceId: row.id, invoiceId: null, expenseId: expense.id },
    };
  } catch (caught: unknown) {
    const message = caught instanceof Error ? caught.message : 'Unknown error creating expense';
    logger.warn(`Skipped We Pay service ${row.id}: ${message}`);
    return { kind: 'failed', message };
  }
}
