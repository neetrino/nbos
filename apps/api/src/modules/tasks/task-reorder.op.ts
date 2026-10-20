import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { assertEntityIsActive } from '../../common/lifecycle/entity-lifecycle-guards';
import { assertTaskAccessible } from './task-access.op';
import type { TasksAccessContext } from './tasks-scoped-access';

export type TaskReorderScope = 'workspace' | 'my-plan';

const TASK_REORDER_SCOPES = new Set<TaskReorderScope>(['workspace', 'my-plan']);

export type TaskReorderInput = {
  taskIds: string[];
  scope: TaskReorderScope;
  access?: TasksAccessContext;
};

/** Assigns sequential sort indices to tasks within a board column reorder. */
export async function reorderTasks(
  prisma: InstanceType<typeof PrismaClient>,
  input: TaskReorderInput,
): Promise<{ success: true }> {
  const { taskIds, scope, access } = input;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw new BadRequestException('taskIds must be a non-empty array');
  }
  if (!TASK_REORDER_SCOPES.has(scope)) {
    throw new BadRequestException('scope must be workspace or my-plan');
  }

  const rows = await prisma.task.findMany({
    where: { id: { in: taskIds } },
    select: { id: true, trashedAt: true },
  });
  if (rows.length !== taskIds.length) {
    throw new BadRequestException('One or more tasks were not found');
  }
  for (const row of rows) {
    assertEntityIsActive(row, 'trashedAt', 'Task');
    await assertTaskAccessible(prisma, row.id, access);
  }

  if (scope === 'my-plan') {
    await reorderMyPlanPlacements(prisma, taskIds, access?.employeeId);
    return { success: true };
  }

  const updates = taskIds.map((taskId, index) =>
    prisma.task.update({
      where: { id: taskId },
      data: { workspaceSortOrder: index },
    }),
  );
  await prisma.$transaction(updates);
  return { success: true };
}

async function reorderMyPlanPlacements(
  prisma: InstanceType<typeof PrismaClient>,
  taskIds: string[],
  employeeId: string | undefined,
): Promise<void> {
  const viewerId = employeeId?.trim();
  if (!viewerId) {
    throw new BadRequestException('My Plan reorder requires the current employee');
  }

  const updates = taskIds.map((taskId, index) =>
    prisma.taskMyPlanPlacement.upsert({
      where: { taskId_employeeId: { taskId, employeeId: viewerId } },
      create: { taskId, employeeId: viewerId, stageId: null, sortOrder: index },
      update: { sortOrder: index },
    }),
  );
  await prisma.$transaction(updates);
}
