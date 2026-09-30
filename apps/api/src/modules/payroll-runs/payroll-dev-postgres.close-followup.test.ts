import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { deleteExpensePaymentRecord } from '../expenses/expense-payment-delete';
import { refundExpensePayrollCash } from '../expenses/expense-payment-refund';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';
import type { NotificationService } from '../notifications/notification.service';
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
const REPLAY_KEY = 'dev-payroll-close-replay';

describe.skipIf(!DATABASE_URL)('payroll close follow-up on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'rejects deleting a payment after the run is closed',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        await closeRun(prisma, ids);
        await expect(removePayment(prisma, ids, paymentId)).rejects.toThrow(
          PAYROLL_CASH_REVERSE_ERRORS.closedHistory,
        );
        const left = await prisma.expensePayment.count({ where: { id: paymentId } });
        expect(left).toBe(1);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'blocks close after the completing payment is deleted',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        await removePayment(prisma, ids, paymentId);
        await expect(closeRun(prisma, ids)).rejects.toThrow(/not fully paid or held/);
        const left = await prisma.expensePayment.count({ where: { id: paymentId } });
        expect(left).toBe(0);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'does not close a run whose payment disappeared in the same moment',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        await Promise.allSettled([closeRun(prisma, ids), removePayment(racer, ids, paymentId)]);
        await expectDeleteCloseConsistent(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'returns the original payment when the same key is sent after close',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids, REPLAY_KEY);
        await closeRun(prisma, ids);
        const again = await payFull(prisma, ids, REPLAY_KEY);
        expect(again).toBe(paymentId);
        const count = await prisma.expensePayment.count({
          where: { expenseId: requireExpense(ids) },
        });
        expect(count).toBe(1);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'shows confirmed bonus cash after pay, refund, and pay again',
    async () => {
      const prisma = openClient();
      const ids = await seedPayrollCashGraph(prisma);
      try {
        await markPaying(prisma, ids);
        const paymentId = await payFull(prisma, ids);
        expect(await poolPaid(prisma, ids)).toBe(BONUS_AMD);
        await refundExpensePayrollCash(prisma, requireExpense(ids), paymentId, {
          amount: Number(NAMED_BONUS_CASH_AMD),
          paymentDate: PAYROLL_DEV_PAY_DATE,
          reason: 'dev pool paid',
        });
        expect(await poolPaid(prisma, ids)).toBe('40000.00');
        await createExpensePaymentRecord(prisma, requireExpense(ids), {
          amount: Number(NAMED_BONUS_CASH_AMD),
          paymentDate: PAYROLL_DEV_PAY_DATE,
          bonusAssignments: [{ bonusReleaseId: requireRelease(ids), amount: NAMED_BONUS_CASH_AMD }],
        });
        expect(await poolPaid(prisma, ids)).toBe(BONUS_AMD);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'keeps one refund per payment and updates pool paid after a partial repay',
    async () => {
      const refunded = openClient();
      const refundedIds = await seedPayrollCashGraph(refunded);
      try {
        await markPaying(refunded, refundedIds);
        const paymentId = await payFull(refunded, refundedIds);
        await refundBonus(refunded, refundedIds, paymentId, NAMED_BONUS_CASH_AMD);
        await refundBonus(refunded, refundedIds, paymentId, '10000.00');
        const rows = await refunded.expensePayment.count({
          where: { expenseId: requireExpense(refundedIds) },
        });
        expect(rows).toBe(2);
        expect(await poolPaid(refunded, refundedIds)).toBe('40000.00');
      } finally {
        await deleteDevPayrollGraph(refunded, refundedIds);
      }

      const partial = openClient();
      const partialIds = await seedPayrollCashGraph(partial);
      try {
        await markPaying(partial, partialIds);
        const paymentId = await payFull(partial, partialIds);
        await refundBonus(partial, partialIds, paymentId, NAMED_BONUS_CASH_AMD);
        await createExpensePaymentRecord(partial, requireExpense(partialIds), {
          amount: 5000,
          paymentDate: PAYROLL_DEV_PAY_DATE,
          bonusAssignments: [{ bonusReleaseId: requireRelease(partialIds), amount: '5000.00' }],
        });
        expect(await poolPaid(partial, partialIds)).toBe('45000.00');
      } finally {
        await deleteDevPayrollGraph(partial, partialIds);
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

async function expectDeleteCloseConsistent(
  prisma: PrismaClient,
  ids: DevPayrollIds,
): Promise<void> {
  const expenseId = requireExpense(ids);
  const [run, payments, line] = await Promise.all([
    prisma.payrollRun.findUnique({ where: { id: requireRun(ids) }, select: { status: true } }),
    prisma.expensePayment.findMany({ where: { expenseId }, select: { amount: true } }),
    prisma.salaryLine.findFirst({ where: { expenseId }, select: { paidAmount: true } }),
  ]);
  const paid = payments.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
  const closedWithoutPayment = run?.status === 'CLOSED' && payments.length === 0;
  expect(closedWithoutPayment).toBe(false);
  expect((line?.paidAmount ?? new Decimal(0)).toFixed(2)).toBe(paid.toFixed(2));
}

async function poolPaid(prisma: PrismaClient, ids: DevPayrollIds): Promise<string> {
  const orderId = ids.orderId;
  if (!orderId) throw new Error('missing order');
  const pool = await prisma.productBonusPool.findUnique({
    where: { orderId },
    select: { totalPaidAmount: true },
  });
  return pool?.totalPaidAmount.toFixed(2) ?? 'missing';
}

async function markPaying(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  await prisma.payrollRun.update({
    where: { id: requireRun(ids) },
    data: { status: 'PAYING' },
  });
}

function closeRun(prisma: PrismaClient, ids: DevPayrollIds): Promise<unknown> {
  const service = new PayrollRunsService(prisma, silentNotifications());
  return service.updateStatus(financeActor(requireEmployee(ids)), requireRun(ids), 'CLOSED');
}

function payFull(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  idempotencyKey?: string,
): Promise<string> {
  return createExpensePaymentRecord(prisma, requireExpense(ids), {
    amount: Number(FULL_CASH_AMD),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    bonusAssignments: [{ bonusReleaseId: requireRelease(ids), amount: BONUS_AMD }],
    idempotencyKey,
  });
}

function removePayment(prisma: PrismaClient, ids: DevPayrollIds, paymentId: string): Promise<void> {
  return deleteExpensePaymentRecord(prisma, requireExpense(ids), paymentId);
}

function refundBonus(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  paymentId: string,
  amount: string,
): Promise<unknown> {
  return refundExpensePayrollCash(prisma, requireExpense(ids), paymentId, {
    amount: Number(amount),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    reason: 'dev pool paid',
  });
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
