import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import { deleteExpensePaymentRecord } from '../expenses/expense-payment-delete';
import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { refundExpensePayrollCash } from '../expenses/expense-payment-refund';
import { OperationalJournalService } from '../finance/journal/operational-journal.service';
import { deleteDevPayrollGraph } from './payroll-dev-postgres.cleanup';
import {
  BONUS_AMD,
  BONUS_LEFT_AMD,
  NAMED_BONUS_CASH_AMD,
  PARTIAL_CASH_AMD,
  PAYROLL_DEV_PAY_DATE,
  PAYROLL_DEV_POSTING_MONTH,
  SALARY_AMD,
  type DevPayrollIds,
} from './payroll-dev-postgres.ids';
import { seedPayrollCashGraph } from './payroll-dev-postgres.seed';
import { sumNetEncodedBonusCashByRelease } from './payroll-salary-first-cash-reverse';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const REFUND_DATE = '2098-06-16T00:00:00.000Z';
const CASE_TIMEOUT_MS = 90_000;

describe.skipIf(!DATABASE_URL)('payroll cash journal on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'pays 320000, refunds the 20000 bonus, pays it again, then deletes back to zero',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      await rememberPostingMonth(prisma, ids);
      try {
        await runCashCycle(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'rolls a failed journal write back and keeps one effect on retry',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      await rememberPostingMonth(prisma, ids);
      try {
        await runJournalFailure(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  function openClient(): PrismaClient {
    const client = createPrismaClient({
      databaseUrl: DATABASE_URL ?? undefined,
      skipBudgetAssert: true,
      skipUrlRewrite: true,
    });
    clients.push(client);
    return client;
  }
});

async function runCashCycle(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const expenseId = requireExpense(ids);
  const releaseId = requireRelease(ids);
  const journal = new OperationalJournalService(prisma);
  const paymentId = await payNamed(prisma, expenseId, releaseId, journal);
  expect((await salaryPaid(prisma, expenseId)).toFixed(2)).toBe(PARTIAL_CASH_AMD);
  expect((await activeNet(prisma, expenseId)).toFixed(2)).toBe(negated(PARTIAL_CASH_AMD));

  await refundExpensePayrollCash(
    prisma,
    expenseId,
    paymentId,
    { amount: Number(NAMED_BONUS_CASH_AMD), paymentDate: REFUND_DATE, reason: 'dev bonus return' },
    { journal },
  );
  expect((await salaryPaid(prisma, expenseId)).toFixed(2)).toBe(SALARY_AMD);
  expect((await activeNet(prisma, expenseId)).toFixed(2)).toBe(negated(SALARY_AMD));

  await payBonusOnly(prisma, expenseId, releaseId, journal);
  expect((await salaryPaid(prisma, expenseId)).toFixed(2)).toBe(PARTIAL_CASH_AMD);
  expect((await unpaidBonus(prisma, expenseId, releaseId)).toFixed(2)).toBe(BONUS_LEFT_AMD);

  const payments = await prisma.expensePayment.findMany({
    where: { expenseId },
    select: { id: true, amount: true },
  });
  for (const payment of payments.filter((row) => row.amount.gt(0))) {
    await deleteExpensePaymentRecord(prisma, expenseId, payment.id, { journal });
  }
  expect((await salaryPaid(prisma, expenseId)).eq(0)).toBe(true);
  expect((await activeNet(prisma, expenseId)).eq(0)).toBe(true);
}

async function runJournalFailure(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const expenseId = requireExpense(ids);
  const flaky = new OnceFailingJournal(prisma);
  await expect(payPlain(prisma, expenseId, flaky)).rejects.toThrow(/injected journal failure/);
  expect(await prisma.expensePayment.count({ where: { expenseId } })).toBe(0);
  expect((await activeNet(prisma, expenseId)).eq(0)).toBe(true);

  const paymentId = await payPlain(prisma, expenseId, flaky);
  expect(await prisma.expensePayment.count({ where: { expenseId } })).toBe(1);
  expect((await activeNet(prisma, expenseId)).toFixed(2)).toBe(negated(SALARY_AMD));
  expect(paymentId).toBeTruthy();
}

class OnceFailingJournal extends OperationalJournalService {
  private armed = true;

  override async appendExpensePaymentLine(
    input: Parameters<OperationalJournalService['appendExpensePaymentLine']>[0],
    db?: Parameters<OperationalJournalService['appendExpensePaymentLine']>[1],
  ): Promise<unknown> {
    if (this.armed) {
      this.armed = false;
      throw new Error('injected journal failure');
    }
    return super.appendExpensePaymentLine(input, db);
  }
}

async function payNamed(
  prisma: PrismaClient,
  expenseId: string,
  releaseId: string,
  journal: OperationalJournalService,
): Promise<string> {
  return createExpensePaymentRecord(
    prisma,
    expenseId,
    {
      amount: Number(PARTIAL_CASH_AMD),
      paymentDate: PAYROLL_DEV_PAY_DATE,
      bonusAssignments: [{ bonusReleaseId: releaseId, amount: NAMED_BONUS_CASH_AMD }],
    },
    { journal },
  );
}

function payBonusOnly(
  prisma: PrismaClient,
  expenseId: string,
  releaseId: string,
  journal: OperationalJournalService,
): Promise<string> {
  return createExpensePaymentRecord(
    prisma,
    expenseId,
    {
      amount: Number(NAMED_BONUS_CASH_AMD),
      paymentDate: REFUND_DATE,
      bonusAssignments: [{ bonusReleaseId: releaseId, amount: NAMED_BONUS_CASH_AMD }],
    },
    { journal },
  );
}

function payPlain(
  prisma: PrismaClient,
  expenseId: string,
  journal: OperationalJournalService,
): Promise<string> {
  return createExpensePaymentRecord(
    prisma,
    expenseId,
    { amount: Number(SALARY_AMD), paymentDate: PAYROLL_DEV_PAY_DATE },
    { journal },
  );
}

async function unpaidBonus(
  prisma: PrismaClient,
  expenseId: string,
  releaseId: string,
): Promise<Decimal> {
  const payments = await prisma.expensePayment.findMany({
    where: { expenseId },
    select: { id: true, amount: true, notes: true },
  });
  const paid = sumNetEncodedBonusCashByRelease(payments).get(releaseId) ?? new Decimal(0);
  return new Decimal(BONUS_AMD).minus(paid);
}

async function salaryPaid(prisma: PrismaClient, expenseId: string): Promise<Decimal> {
  const line = await prisma.salaryLine.findFirst({
    where: { expenseId },
    select: { paidAmount: true },
  });
  return line?.paidAmount ?? new Decimal(0);
}

async function activeNet(prisma: PrismaClient, expenseId: string): Promise<Decimal> {
  const payments = await prisma.expensePayment.findMany({
    where: { expenseId },
    select: { id: true },
  });
  if (payments.length === 0) {
    return new Decimal(0);
  }
  const rows = await prisma.operationalJournalEntry.findMany({
    where: { sourceId: { in: payments.map((row) => row.id) }, status: 'ACTIVE' },
    select: { functionalAmount: true },
  });
  return rows.reduce((sum, row) => sum.plus(row.functionalAmount), new Decimal(0));
}

async function rememberPostingMonth(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const existing = await prisma.financePostingPeriod.findUnique({
    where: { monthKey: PAYROLL_DEV_POSTING_MONTH },
    select: { id: true },
  });
  if (!existing) {
    ids.createdPostingMonths.push(PAYROLL_DEV_POSTING_MONTH);
  }
}

function negated(amount: string): string {
  return new Decimal(amount).negated().toFixed(2);
}

function requireExpense(ids: DevPayrollIds): string {
  const id = ids.expenseIds[0];
  if (!id) throw new Error('missing expense');
  return id;
}

function requireRelease(ids: DevPayrollIds): string {
  const id = ids.releaseIds[0];
  if (!id) throw new Error('missing release');
  return id;
}
