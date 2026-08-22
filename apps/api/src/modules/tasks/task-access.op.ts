import { NotFoundException } from '@nestjs/common';
import { buildTasksParticipationWhere } from './task-involves-employee-where.op';
import type { TasksDbClient } from './tasks-db-client';
import {
  loadTasksScopedEmployeeIds,
  tasksViewBypassesRowFilter,
  type TasksAccessContext,
} from './tasks-scoped-access';

/** Ensures the viewer may read or mutate a task (404 when denied). */
export async function assertTaskAccessible(
  prisma: TasksDbClient,
  taskId: string,
  access: TasksAccessContext | undefined,
): Promise<void> {
  if (!access || tasksViewBypassesRowFilter(access.viewScope)) return;

  const scopedIds = await loadTasksScopedEmployeeIds(prisma, access);
  const row = await prisma.task.findFirst({
    where: {
      AND: [{ id: taskId }, buildTasksParticipationWhere(scopedIds)],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException(`Task ${taskId} not found`);
  }
}
