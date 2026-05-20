import type { PrismaClient, TaskStatusEnum } from '@nbos/database';
import type { ProductOpenCounts } from './product-current-stage-readiness';

/** Prisma task statuses only — `DONE` is legacy in gate strings, not in `TaskStatusEnum`. */
const CLOSED_TASK_STATUSES: TaskStatusEnum[] = ['ON_HOLD', 'COMPLETED'];

export async function batchProductOpenCounts(
  prisma: InstanceType<typeof PrismaClient>,
  productIds: string[],
): Promise<Map<string, ProductOpenCounts>> {
  const map = new Map<string, ProductOpenCounts>();
  for (const id of productIds) {
    map.set(id, { openTasks: 0, openTickets: 0, openExtensions: 0 });
  }
  if (productIds.length === 0) return map;

  const [taskGroups, ticketGroups, extGroups] = await Promise.all([
    prisma.task.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: { notIn: CLOSED_TASK_STATUSES },
      },
      _count: { _all: true },
    }),
    prisma.supportTicket.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
      _count: { _all: true },
    }),
    prisma.extension.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: { notIn: ['DONE', 'LOST'] },
      },
      _count: { _all: true },
    }),
  ]);

  for (const row of taskGroups) {
    if (!row.productId) continue;
    const cur = map.get(row.productId);
    if (cur) cur.openTasks = row._count._all;
  }
  for (const row of ticketGroups) {
    if (!row.productId) continue;
    const cur = map.get(row.productId);
    if (cur) cur.openTickets = row._count._all;
  }
  for (const row of extGroups) {
    if (!row.productId) continue;
    const cur = map.get(row.productId);
    if (cur) cur.openExtensions = row._count._all;
  }

  return map;
}
