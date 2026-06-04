import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { assertTaskAccessible } from './task-access.op';
import type { TasksAccessContext } from './tasks-scoped-access';

export type TaskReorderScope = 'workspace' | 'my-plan';

const TASK_REORDER_SCOPES = new Set<TaskReorderScope>(['workspace', 'my-plan']);

export type TaskReorderInput = {
  taskIds: string[];
  scope: TaskReorderScope;
  access?: TasksAccessContext;
};

function resolveSortField(scope: TaskReorderScope): 'workspaceSortOrder' | 'myPlanSortOrder' {
  return scope === 'workspace' ? 'workspaceSortOrder' : 'myPlanSortOrder';
}

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

  for (const taskId of taskIds) {
    await assertTaskAccessible(prisma, taskId, access);
  }

  const sortField = resolveSortField(scope);
  const updates = taskIds.map((taskId, index) =>
    prisma.task.update({
      where: { id: taskId },
      data: { [sortField]: index },
    }),
  );
  await prisma.$transaction(updates);
  return { success: true };
}
