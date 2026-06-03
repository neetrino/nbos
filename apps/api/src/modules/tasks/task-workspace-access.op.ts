import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import {
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from '../platform-access/platform-team-graph.where';
import { taskDirectInvolvementClauses } from './task-involves-employee-where.op';
import {
  loadTasksScopedEmployeeIds,
  tasksViewBypassesRowFilter,
  type TasksAccessContext,
} from './tasks-scoped-access';

/** Work spaces the viewer may access (project/product/extension graph or standalone task involvement). */
export function buildWorkSpaceParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.WorkSpaceWhereInput {
  return {
    OR: [
      { project: buildProjectParticipationWhere(scopedEmployeeIds) },
      { product: buildProductParticipationWhere(scopedEmployeeIds) },
      {
        extension: {
          OR: [
            { assignedTo: { in: scopedEmployeeIds } },
            { closedById: { in: scopedEmployeeIds } },
            { product: buildProductParticipationWhere(scopedEmployeeIds) },
          ],
        },
      },
      {
        type: 'STANDALONE_OPERATIONAL',
        tasks: { some: { OR: taskDirectInvolvementClauses(scopedEmployeeIds) } },
      },
    ],
  };
}

export async function assertWorkSpaceTasksAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  workspaceId: string,
  access: TasksAccessContext | undefined,
): Promise<void> {
  if (!access || tasksViewBypassesRowFilter(access.viewScope)) return;

  const scopedIds = await loadTasksScopedEmployeeIds(prisma, access);
  const row = await prisma.workSpace.findFirst({
    where: { id: workspaceId, ...buildWorkSpaceParticipationWhere(scopedIds) },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Work space not found.');
  }
}
