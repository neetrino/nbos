import { Decimal, type PrismaClient } from '@nbos/database';

import { decimalFrom, BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';

import { PAYROLL_MONTH_REGEX } from './payroll-runs.constants';

/**
 * Inclusive start (UTC midnight) and exclusive end for the calendar month of `YYYY-MM`.
 * Returns null if `payrollMonth` is not a valid payroll month key.
 */
export function parsePayrollMonthToUtcRange(payrollMonth: string): { gte: Date; lt: Date } | null {
  if (!PAYROLL_MONTH_REGEX.test(payrollMonth)) return null;
  const [yearStr, monthStr] = payrollMonth.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }
  const gte = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const lt = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  return { gte, lt };
}

/**
 * Suggested KPI sales actual for a payroll month: sum of `Payment.amount` where
 * `paymentDate` falls in that calendar month (UTC). Aligns with payment aggregates
 * that filter by `paymentDate` only (see PaymentsService).
 */
export async function sumPaymentsForPayrollMonthSuggestedSalesKpi(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<Decimal> {
  const range = parsePayrollMonthToUtcRange(payrollMonth);
  if (!range) return BONUS_POOL_ZERO;

  const agg = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: range.gte, lt: range.lt },
    },
    _sum: { amount: true },
  });

  return decimalFrom(agg._sum.amount);
}

type PaymentSellerRow = {
  amount: { toString(): string } | number | string;
  invoice: {
    order: { deal: { sellerId: string } | null } | null;
  };
};

type SalesPaymentSourceRow = {
  id: string;
  amount: { toString(): string } | number | string;
  paymentDate: Date;
  invoice: {
    id: string;
    code: string;
    order: { id: string; code: string; deal: { id: string; sellerId: string } | null } | null;
  };
};

/**
 * Per-seller suggested KPI actual: sum of `Payment.amount` in the payroll month (UTC)
 * for invoices on orders whose deal `sellerId` matches the employee.
 */
export async function sumPaymentsBySellerForPayrollMonthSuggestedSalesKpi(
  prisma: PrismaClient,
  payrollMonth: string,
  sellerIds: string[],
): Promise<Map<string, Decimal>> {
  const range = parsePayrollMonthToUtcRange(payrollMonth);
  const totals = new Map<string, Decimal>();
  if (!range) {
    return totals;
  }

  const unique = [...new Set(sellerIds)].filter((id) => id.length > 0);
  for (const id of unique) {
    totals.set(id, BONUS_POOL_ZERO);
  }
  if (unique.length === 0) {
    return totals;
  }

  const payments = (await prisma.payment.findMany({
    where: {
      paymentDate: { gte: range.gte, lt: range.lt },
      invoice: {
        orderId: { not: null },
        order: {
          dealId: { not: null },
          deal: { sellerId: { in: unique } },
        },
      },
    },
    select: {
      amount: true,
      invoice: {
        select: {
          order: { select: { deal: { select: { sellerId: true } } } },
        },
      },
    },
  })) as PaymentSellerRow[];

  for (const payment of payments) {
    const sellerId = payment.invoice.order?.deal?.sellerId;
    if (sellerId == null) {
      continue;
    }
    const prev = totals.get(sellerId) ?? BONUS_POOL_ZERO;
    totals.set(sellerId, prev.plus(decimalFrom(String(payment.amount))));
  }

  return totals;
}

export async function listSalesPaymentFactsForEmployee(
  prisma: PrismaClient,
  payrollMonth: string,
  employeeId: string,
): Promise<{
  total: Decimal;
  payments: Array<{
    paymentId: string;
    invoiceId: string;
    invoiceCode: string;
    orderId: string;
    orderCode: string;
    dealId: string;
    amount: string;
    paymentDate: string;
  }>;
}> {
  const range = parsePayrollMonthToUtcRange(payrollMonth);
  if (!range) {
    return { total: BONUS_POOL_ZERO, payments: [] };
  }

  const rows = (await prisma.payment.findMany({
    where: {
      paymentDate: { gte: range.gte, lt: range.lt },
      invoice: {
        orderId: { not: null },
        order: {
          dealId: { not: null },
          deal: { sellerId: employeeId },
        },
      },
    },
    select: {
      id: true,
      amount: true,
      paymentDate: true,
      invoice: {
        select: {
          id: true,
          code: true,
          order: {
            select: {
              id: true,
              code: true,
              deal: { select: { id: true, sellerId: true } },
            },
          },
        },
      },
    },
    orderBy: { paymentDate: 'asc' },
  })) as SalesPaymentSourceRow[];

  let total = BONUS_POOL_ZERO;
  const payments = rows.flatMap((row) => {
    const order = row.invoice.order;
    const deal = order?.deal;
    if (!order || !deal) return [];
    const amount = decimalFrom(String(row.amount));
    total = total.plus(amount);
    return [
      {
        paymentId: row.id,
        invoiceId: row.invoice.id,
        invoiceCode: row.invoice.code,
        orderId: order.id,
        orderCode: order.code,
        dealId: deal.id,
        amount: amount.toFixed(2),
        paymentDate: row.paymentDate.toISOString(),
      },
    ];
  });

  return { total, payments };
}
