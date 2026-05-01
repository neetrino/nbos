import type { PrismaClient } from '@nbos/database';
import { sql } from '@nbos/database';
import {
  buildOrdersReconciliationWhereSql,
  type OrderReconciliationListGap,
} from './order-reconciliation-list-filter';

interface GapPageParams {
  gap: OrderReconciliationListGap;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  projectId?: string;
  partnerId?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export async function queryOrderIdsPageForReconciliationGap(
  prisma: InstanceType<typeof PrismaClient>,
  params: GapPageParams,
): Promise<{ total: number; ids: string[] }> {
  const skip = (params.page - 1) * params.pageSize;
  const whereSql = buildOrdersReconciliationWhereSql({
    gap: params.gap,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    status: params.status,
    projectId: params.projectId,
    partnerId: params.partnerId,
    search: params.search,
  });

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>(
      sql`SELECT COUNT(*)::bigint AS count FROM orders o WHERE ${whereSql}`,
    ),
    prisma.$queryRaw<{ id: string }[]>(
      sql`
        SELECT o.id FROM orders o
        WHERE ${whereSql}
        ORDER BY o.created_at DESC
        LIMIT ${params.pageSize} OFFSET ${skip}
      `,
    ),
  ]);

  return {
    total: Number(countRows[0]?.count ?? 0),
    ids: idRows.map((row) => row.id),
  };
}
