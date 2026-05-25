import type { PrismaClient } from '@nbos/database';
import { EXTENSION_GATE_CLOSED_TASK_STATUSES } from '../delivery-readiness-gate-statuses';

export async function batchExtensionOpenTaskCounts(
  prisma: InstanceType<typeof PrismaClient>,
  extensionIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const id of extensionIds) map.set(id, 0);
  if (extensionIds.length === 0) return map;

  const closedTasks = [...EXTENSION_GATE_CLOSED_TASK_STATUSES];

  const rows = await prisma.task.groupBy({
    by: ['extensionId'],
    where: {
      extensionId: { in: extensionIds },
      status: { notIn: closedTasks },
    },
    _count: true,
  });

  for (const row of rows) {
    if (!row.extensionId) continue;
    map.set(row.extensionId, row._count);
  }

  return map;
}
