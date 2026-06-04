import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { buildProjectParticipationWhere } from '../platform-access/platform-team-graph.where';
import {
  loadTasksScopedEmployeeIds,
  tasksViewBypassesRowFilter,
  type TasksAccessContext,
} from './tasks-scoped-access';

/**
 * Ensures the viewer may list tasks for a project (Project Hub / delivery board).
 * Uses the same participation graph as Drive and Finance; returns 404 when denied.
 */
export async function assertProjectTasksAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  projectId: string,
  access: TasksAccessContext | undefined,
): Promise<void> {
  if (!access || tasksViewBypassesRowFilter(access.viewScope)) return;

  const scopedIds = await loadTasksScopedEmployeeIds(prisma, access);
  const row = await prisma.project.findFirst({
    where: { id: projectId, ...buildProjectParticipationWhere(scopedIds) },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Project not found.');
  }
}
