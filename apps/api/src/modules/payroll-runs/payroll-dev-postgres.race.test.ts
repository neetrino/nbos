import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import { PayrollRunsService } from './payroll-runs.service';
import { deleteDevPayrollGraph } from './payroll-dev-postgres.cleanup';
import {
  APPROVAL_SALARY_AMD,
  BONUS_AMD,
  NAMED_BONUS_CASH_AMD,
  PARTIAL_CASH_AMD,
  PAYROLL_DEV_PAY_DATE,
  RACE_CASH_AMD,
  SALARY_AMD,
  type DevPayrollIds,
} from './payroll-dev-postgres.ids';
import { seedPayrollApprovalGraph, seedPayrollCashGraph } from './payroll-dev-postgres.seed';
import type { NotificationService } from '../notifications/notification.service';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';

const IDEMPOTENT_SECOND_CASH_AMD = '100000.00';
const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const CASE_TIMEOUT_MS = 90_000;

describe.skipIf(!DATABASE_URL)('V-13 payroll races on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'rejects a second 200000 payment that would pass the 360000 payable',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await raceCash(prisma, racer, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'stores one 320000 payment when the same bonus assignment is sent twice',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await raceBonusAssignment(prisma, racer, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'approves one payroll run once when two requests arrive together',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      const ids = await seedPayrollApprovalGraph(prisma);
      try {
        await raceApproval(prisma, racer, ids);
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

async function raceCash(
  prisma: PrismaClient,
  racer: PrismaClient,
  ids: DevPayrollIds,
): Promise<void> {
  const expenseId = requireExpense(ids);
  const results = await Promise.allSettled([
    pay(prisma, expenseId, RACE_CASH_AMD),
    pay(racer, expenseId, RACE_CASH_AMD),
  ]);
  const paid = await sumExpensePayments(prisma, expenseId);
  expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1);
  expect(paid.toFixed(2)).toBe(new Decimal(RACE_CASH_AMD).toFixed(2));
  expect(paid.lte(new Decimal(SALARY_AMD).plus(BONUS_AMD))).toBe(true);
  const replay = await pay(prisma, expenseId, IDEMPOTENT_SECOND_CASH_AMD, 'dev-pay-replay');
  const again = await pay(prisma, expenseId, IDEMPOTENT_SECOND_CASH_AMD, 'dev-pay-replay');
  expect(again).toBe(replay);
  expect((await countPayments(prisma, expenseId)).toString()).toBe('2');
  const afterReplay = await sumExpensePayments(prisma, expenseId);
  expect(afterReplay.toFixed(2)).toBe(
    new Decimal(RACE_CASH_AMD).plus(IDEMPOTENT_SECOND_CASH_AMD).toFixed(2),
  );
}

async function raceBonusAssignment(
  prisma: PrismaClient,
  racer: PrismaClient,
  ids: DevPayrollIds,
): Promise<void> {
  const expenseId = requireExpense(ids);
  const releaseId = requireRelease(ids);
  const input = {
    amount: Number(PARTIAL_CASH_AMD),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    bonusAssignments: [{ bonusReleaseId: releaseId, amount: NAMED_BONUS_CASH_AMD }],
  };
  const results = await Promise.allSettled([
    createExpensePaymentRecord(prisma, expenseId, input),
    createExpensePaymentRecord(racer, expenseId, input),
  ]);
  expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1);
  const paid = await sumExpensePayments(prisma, expenseId);
  expect(paid.toFixed(2)).toBe(PARTIAL_CASH_AMD);
  const line = await prisma.salaryLine.findFirst({
    where: { expenseId },
    select: { paidAmount: true },
  });
  expect(line?.paidAmount.toFixed(2)).toBe(PARTIAL_CASH_AMD);
}

async function raceApproval(
  prisma: PrismaClient,
  racer: PrismaClient,
  ids: DevPayrollIds,
): Promise<void> {
  const runId = requireRun(ids);
  const actor = financeActor(requireEmployee(ids));
  const first = new PayrollRunsService(prisma, silentNotifications());
  const second = new PayrollRunsService(racer, silentNotifications());
  const results = await Promise.allSettled([
    first.updateStatus(actor, runId, 'APPROVED'),
    second.updateStatus(actor, runId, 'APPROVED'),
  ]);
  expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1);
  const repeat = await Promise.allSettled([first.updateStatus(actor, runId, 'APPROVED')]);
  expect(repeat[0]?.status).toBe('rejected');
  const run = await prisma.payrollRun.findUnique({
    where: { id: runId },
    select: { status: true },
  });
  const expenses = await prisma.expense.count({
    where: { salaryLine: { payrollRunId: runId } },
  });
  expect(run?.status).toBe('APPROVED');
  expect(expenses).toBe(1);
  const line = await prisma.salaryLine.findFirst({
    where: { payrollRunId: runId },
    select: { totalPayable: true, expenseId: true },
  });
  expect(line?.expenseId).toBeTruthy();
  expect(line?.totalPayable.toFixed(2)).toBe(APPROVAL_SALARY_AMD);
  if (line?.expenseId) {
    ids.expenseIds.push(line.expenseId);
  }
}

function pay(
  prisma: PrismaClient,
  expenseId: string,
  amount: string,
  idempotencyKey?: string,
): Promise<string> {
  return createExpensePaymentRecord(prisma, expenseId, {
    amount: Number(amount),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    idempotencyKey,
  });
}

async function sumExpensePayments(prisma: PrismaClient, expenseId: string): Promise<Decimal> {
  const rows = await prisma.expensePayment.findMany({
    where: { expenseId },
    select: { amount: true },
  });
  return rows.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
}

async function countPayments(prisma: PrismaClient, expenseId: string): Promise<number> {
  return prisma.expensePayment.count({ where: { expenseId } });
}

function financeActor(id: string): FinancePayActor {
  return {
    id,
    permissions: {
      FINANCE_SALARY_VIEW: 'ALL',
      FINANCE_SALARY_ADD: 'ALL',
      FINANCE_SALARY_EDIT: 'ALL',
    },
    departmentIds: [],
  };
}

function silentNotifications(): NotificationService {
  return new Proxy({}, { get: () => () => Promise.resolve(undefined) }) as NotificationService;
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

function requireRun(ids: DevPayrollIds): string {
  const id = ids.payrollRunIds[0];
  if (!id) throw new Error('missing payroll run');
  return id;
}

function requireEmployee(ids: DevPayrollIds): string {
  const id = ids.employeeIds[0];
  if (!id) throw new Error('missing employee');
  return id;
}
