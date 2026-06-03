import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { buildTasksParticipationWhere } from './task-involves-employee-where.op';
import {
  loadTasksScopedEmployeeIds,
  tasksViewBypassesRowFilter,
  type TasksAccessContext,
} from './tasks-scoped-access';

/** Ensures the viewer may read or mutate a task (404 when denied). */
export async function assertTaskAccessible(
  prisma: InstanceType<typeof PrismaClient>,
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
