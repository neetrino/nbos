import type { PrismaClient } from '@nbos/database';
import { sql } from '@nbos/database';
import {
  buildOrdersReconciliationWhereSql,
  orderPaidThroughInvoicesSql,
  type OrderReconciliationListGap,
} from './order-reconciliation-list-filter';

interface GapStatsParams {
  gap: OrderReconciliationListGap;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  projectId?: string;
  partnerId?: string;
  search?: string;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return Number(value);
}

export async function queryOrderStatsForReconciliationGap(
  prisma: InstanceType<typeof PrismaClient>,
  params: GapStatsParams,
): Promise<{
  totalOrders: number;
  totalAmount: number | null;
  collectedAmount: number | null;
  outstandingAmount: number;
  byStatus: Array<{
    status: string;
    _count: number;
    _sum: { totalAmount: number | null };
  }>;
}> {
  const whereSql = buildOrdersReconciliationWhereSql({
    gap: params.gap,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    status: params.status,
    projectId: params.projectId,
    partnerId: params.partnerId,
    search: params.search,
  });

  const paidSql = orderPaidThroughInvoicesSql();

  const [summaryRows, statusRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        order_count: bigint;
        total_amount_sum: unknown;
        collected_sum: unknown;
      }>
    >(sql`
      SELECT
        COUNT(*)::bigint AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS total_amount_sum,
        COALESCE(SUM(${paidSql}), 0) AS collected_sum
      FROM orders o
      WHERE ${whereSql}
    `),
    prisma.$queryRaw<
      Array<{
        status: string;
        cnt: bigint;
        amt: unknown;
      }>
    >(sql`
      SELECT o.status::text AS status,
             COUNT(*)::bigint AS cnt,
             COALESCE(SUM(o.total_amount), 0) AS amt
      FROM orders o
      WHERE ${whereSql}
      GROUP BY o.status
    `),
  ]);

  const summary = summaryRows[0];
  const totalOrders = toNumber(summary?.order_count);
  const totalAmountValue = toNumber(summary?.total_amount_sum);
  const collectedAmountValue = toNumber(summary?.collected_sum);

  return {
    totalOrders,
    totalAmount: summary ? totalAmountValue : null,
    collectedAmount: summary ? collectedAmountValue : null,
    outstandingAmount: totalAmountValue - collectedAmountValue,
    byStatus: statusRows.map((row) => ({
      status: row.status,
      _count: toNumber(row.cnt),
      _sum: { totalAmount: toNumber(row.amt) },
    })),
  };
}
