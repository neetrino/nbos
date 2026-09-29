import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { refundExpensePayrollCash } from '../expenses/expense-payment-refund';
import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import type { NotificationService } from '../notifications/notification.service';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';
import { deleteDevPayrollGraph } from './payroll-dev-postgres.cleanup';
import {
  BONUS_AMD,
  NAMED_BONUS_CASH_AMD,
  PAYROLL_DEV_PAY_DATE,
  SALARY_AMD,
  type DevPayrollIds,
} from './payroll-dev-postgres.ids';
import { seedPayrollCashGraph } from './payroll-dev-postgres.seed';
import { PAYROLL_CASH_REVERSE_ERRORS } from './payroll-salary-first-cash-reverse';
import { PayrollRunsService } from './payroll-runs.service';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const CASE_TIMEOUT_MS = 90_000;
const FULL_CASH_AMD = new Decimal(SALARY_AMD).plus(BONUS_AMD).toFixed(2);
const AFTER_REFUND_AMD = new Decimal(FULL_CASH_AMD).minus(NAMED_BONUS_CASH_AMD).toFixed(2);
const HELD_PAYMENT_AMD = '10000.00';

describe.skipIf(!DATABASE_URL)('payroll close versus cash on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'rejects close before the completing payment and keeps that payment once',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        await expect(closeRun(prisma, ids)).rejects.toThrow(/not fully paid or held/);
        await payFull(prisma, ids);
        await expectPaidOnce(prisma, ids, FULL_CASH_AMD, 'PAYING', 1);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'closes after the completing payment without a second cash row',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        await payFull(prisma, ids);
        await closeRun(prisma, ids);
        await expectPaidOnce(prisma, ids, FULL_CASH_AMD, 'CLOSED', 1);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'keeps one completing payment when close runs at the same time',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        await Promise.allSettled([closeRun(prisma, ids), payFull(racer, ids)]);
        await expectSingleCashOutcome(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'rejects a payment after a held line is closed',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        await holdLine(prisma, ids);
        await closeRun(prisma, ids);
        await expect(payAmount(prisma, ids, HELD_PAYMENT_AMD)).rejects.toThrow(
          PAYROLL_CASH_REVERSE_ERRORS.closedHistory,
        );
        await expectPaidOnce(prisma, ids, '0.00', 'CLOSED', 0);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'rejects a refund after close and keeps the paid total',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        await closeRun(prisma, ids);
        await expect(refundBonus(prisma, ids, paymentId)).rejects.toThrow(/Closed payroll history/);
        await expectPaidOnce(prisma, ids, FULL_CASH_AMD, 'CLOSED', 1);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'rejects close after a refund has reopened the remainder',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        await refundBonus(prisma, ids, paymentId);
        await expect(closeRun(prisma, ids)).rejects.toThrow(/not fully paid or held/);
        await expectPaidOnce(prisma, ids, AFTER_REFUND_AMD, 'PAYING', 2);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'does not close and refund the same paid run together',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        await Promise.allSettled([closeRun(prisma, ids), refundBonus(racer, ids, paymentId)]);
        await expectCloseRefundOutcome(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  function openClient(): PrismaClient {
    const client = createPrismaClient({
      databaseUrl: DATABASE_URL,
      skipBudgetAssert: true,
      skipUrlRewrite: true,
    });
    clients.push(client);
    return client;
  }
});

async function markPaying(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  await prisma.payrollRun.update({
    where: { id: requireRun(ids) },
    data: { status: 'PAYING' },
  });
}

async function holdLine(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  await prisma.salaryLine.updateMany({
    where: { expenseId: requireExpense(ids) },
    data: { status: 'HELD' },
  });
}

function closeRun(prisma: PrismaClient, ids: DevPayrollIds): Promise<unknown> {
  const service = new PayrollRunsService(prisma, silentNotifications());
  return service.updateStatus(financeActor(requireEmployee(ids)), requireRun(ids), 'CLOSED');
}

function payFull(prisma: PrismaClient, ids: DevPayrollIds): Promise<string> {
  return createExpensePaymentRecord(prisma, requireExpense(ids), {
    amount: Number(FULL_CASH_AMD),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    bonusAssignments: [{ bonusReleaseId: requireRelease(ids), amount: BONUS_AMD }],
  });
}

function payAmount(prisma: PrismaClient, ids: DevPayrollIds, amount: string): Promise<string> {
  return createExpensePaymentRecord(prisma, requireExpense(ids), {
    amount: Number(amount),
    paymentDate: PAYROLL_DEV_PAY_DATE,
  });
}

function refundBonus(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  paymentId: string,
): Promise<unknown> {
  return refundExpensePayrollCash(prisma, requireExpense(ids), paymentId, {
    amount: Number(NAMED_BONUS_CASH_AMD),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    reason: 'dev close race',
  });
}

async function expectPaidOnce(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  paid: string,
  status: 'PAYING' | 'CLOSED',
  paymentCount: number,
): Promise<void> {
  const snapshot = await loadCashSnapshot(prisma, ids);
  expect(snapshot.status).toBe(status);
  expect(snapshot.paymentCount).toBe(paymentCount);
  expect(snapshot.paid.toFixed(2)).toBe(paid);
  expect(snapshot.linePaid.toFixed(2)).toBe(paid);
  const remaining = new Decimal(FULL_CASH_AMD).minus(paid).toFixed(2);
  expect(snapshot.lineRemaining.toFixed(2)).toBe(remaining);
}

async function expectSingleCashOutcome(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const snapshot = await loadCashSnapshot(prisma, ids);
  expect(snapshot.paymentCount).toBe(1);
  expect(snapshot.paid.toFixed(2)).toBe(FULL_CASH_AMD);
  expect(snapshot.linePaid.toFixed(2)).toBe(FULL_CASH_AMD);
  expect(snapshot.lineRemaining.toFixed(2)).toBe('0.00');
  expect(['PAYING', 'CLOSED']).toContain(snapshot.status);
}

async function expectCloseRefundOutcome(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const snapshot = await loadCashSnapshot(prisma, ids);
  const closedWithoutRefund =
    snapshot.status === 'CLOSED' && snapshot.paid.toFixed(2) === FULL_CASH_AMD;
  const openAfterRefund =
    snapshot.status === 'PAYING' && snapshot.paid.toFixed(2) === AFTER_REFUND_AMD;
  expect(closedWithoutRefund || openAfterRefund).toBe(true);
  expect(snapshot.linePaid.toFixed(2)).toBe(snapshot.paid.toFixed(2));
  expect(snapshot.paymentCount).toBe(closedWithoutRefund ? 1 : 2);
}

async function loadCashSnapshot(prisma: PrismaClient, ids: DevPayrollIds) {
  const expenseId = requireExpense(ids);
  const [run, line, payments] = await Promise.all([
    prisma.payrollRun.findUnique({
      where: { id: requireRun(ids) },
      select: { status: true },
    }),
    prisma.salaryLine.findFirst({
      where: { expenseId },
      select: { paidAmount: true, remainingAmount: true },
    }),
    prisma.expensePayment.findMany({ where: { expenseId }, select: { amount: true } }),
  ]);
  const paid = payments.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
  return {
    status: run?.status,
    paymentCount: payments.length,
    paid,
    linePaid: line?.paidAmount ?? new Decimal(0),
    lineRemaining: line?.remainingAmount ?? new Decimal(0),
  };
}

function financeActor(id: string): FinancePayActor {
  return {
    id,
    permissions: { FINANCE_SALARY_EDIT: 'ALL', FINANCE_SALARY_VIEW: 'ALL' },
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
