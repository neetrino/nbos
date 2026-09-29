import { Decimal, type PrismaClient } from '@nbos/database';

import { sumNetEncodedBonusCashByRelease } from '../payroll-runs/payroll-salary-first-cash-reverse';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';

type PaidCashDb = Pick<PrismaClient, 'bonusRelease' | 'salaryLine'>;

/**
 * Cash already attributed to an order's bonus releases.
 * A PAID release with no payment note still counts as confirmed cash for that release.
 * A PAID bonus entry with no release is not cash and is omitted.
 */
export async function confirmedBonusCashByOrder(
  prisma: PaidCashDb,
  orderIds: readonly string[],
): Promise<Map<string, Decimal>> {
  const totals = new Map<string, Decimal>();
  if (orderIds.length === 0) {
    return totals;
  }
  const releases = await prisma.bonusRelease.findMany({
    where: { bonusEntry: { orderId: { in: [...orderIds] } } },
    select: {
      id: true,
      amount: true,
      status: true,
      payrollRunId: true,
      bonusEntry: { select: { orderId: true } },
    },
  });
  const attributed = await attributedCashByRelease(prisma, releases);
  for (const release of releases) {
    const orderId = release.bonusEntry.orderId;
    const cash = cashForRelease(release, attributed);
    totals.set(orderId, (totals.get(orderId) ?? BONUS_POOL_ZERO).plus(cash));
  }
  return totals;
}

/** Replaces status-summed Paid with confirmed cash when the order has releases. */
export async function overlayPoolPaidFromCash<
  T extends {
    orderIds: string[];
    sumPaidAmount: string;
    paidCashState: 'CONFIRMED' | 'UNCONFIRMED';
  },
>(prisma: PaidCashDb, rows: T[]): Promise<T[]> {
  const orderIds = [...new Set(rows.flatMap((row) => row.orderIds))];
  const found = await prisma.bonusRelease.findMany({
    where: { bonusEntry: { orderId: { in: orderIds } } },
    select: { bonusEntry: { select: { orderId: true } } },
  });
  if (!Array.isArray(found)) {
    return rows;
  }
  const withReleases = new Set(found.map((row) => row.bonusEntry.orderId));
  const cash = await confirmedBonusCashByOrder(prisma, orderIds);
  return rows.map((row) => markPoolPaid(row, withReleases, cash));
}

function markPoolPaid<
  T extends {
    orderIds: string[];
    sumPaidAmount: string;
    paidCashState: 'CONFIRMED' | 'UNCONFIRMED';
  },
>(row: T, withReleases: ReadonlySet<string>, cash: Map<string, Decimal>): T {
  if (!row.orderIds.some((id) => withReleases.has(id))) {
    if (decimalFrom(row.sumPaidAmount).gt(BONUS_POOL_ZERO)) {
      return { ...row, paidCashState: 'UNCONFIRMED' };
    }
    return row;
  }
  const paid = row.orderIds.reduce(
    (sum, id) => sum.plus(cash.get(id) ?? BONUS_POOL_ZERO),
    BONUS_POOL_ZERO,
  );
  return { ...row, sumPaidAmount: paid.toFixed(2), paidCashState: 'CONFIRMED' };
}

async function attributedCashByRelease(
  prisma: PaidCashDb,
  releases: { id: string; payrollRunId: string | null }[],
): Promise<Map<string, Decimal>> {
  const runIds = [...new Set(releases.map((row) => row.payrollRunId).filter(isRunId))];
  if (runIds.length === 0) {
    return new Map();
  }
  const lines = await prisma.salaryLine.findMany({
    where: { payrollRunId: { in: runIds } },
    select: {
      expense: { select: { expensePayments: { select: { id: true, amount: true, notes: true } } } },
    },
  });
  const payments = lines.flatMap((line) => line.expense?.expensePayments ?? []);
  return sumNetEncodedBonusCashByRelease(payments);
}

function cashForRelease(
  release: { id: string; amount: Decimal; status: string },
  attributed: Map<string, Decimal>,
): Decimal {
  if (attributed.has(release.id)) {
    return decimalFrom(attributed.get(release.id));
  }
  if (release.status === 'PAID') {
    return decimalFrom(release.amount);
  }
  return BONUS_POOL_ZERO;
}

function isRunId(value: string | null): value is string {
  return value != null;
}

type ExpensePoolDb = PaidCashDb & Pick<PrismaClient, 'productBonusPool'>;

/** Rewrites pool paid from confirmed cash after the payroll transaction has committed. */
export async function refreshConfirmedPoolPaidForExpense(
  prisma: ExpensePoolDb,
  expenseId: string,
): Promise<void> {
  const line = await prisma.salaryLine.findFirst({
    where: { expenseId },
    select: { payrollRunId: true, employeeId: true },
  });
  if (line == null) {
    return;
  }
  const releases = await prisma.bonusRelease.findMany({
    where: { payrollRunId: line.payrollRunId, employeeId: line.employeeId },
    select: { bonusEntry: { select: { orderId: true } } },
  });
  const orderIds = [...new Set(releases.map((row) => row.bonusEntry.orderId))];
  const cash = await confirmedBonusCashByOrder(prisma, orderIds);
  for (const orderId of orderIds) {
    const paid = cash.get(orderId);
    if (paid == null) {
      continue;
    }
    await prisma.productBonusPool.updateMany({
      where: { orderId },
      data: { totalPaidAmount: paid },
    });
  }
}
