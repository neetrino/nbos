import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { assertTaskAccessible } from '../../tasks/task-access.op';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';

type PrismaLike = InstanceType<typeof PrismaClient>;

const TASK_NOT_FOUND = 'Task not found';
const CONVERSATION_NOT_FOUND = 'Conversation not found';

export type TaskEnsureRow = {
  id: string;
  title: string;
  creatorId: string;
  assigneeId: string | null;
  reviewerId: string | null;
  coAssignees: string[];
  observers: string[];
};

const TASK_ENSURE_SELECT = {
  id: true,
  title: true,
  creatorId: true,
  assigneeId: true,
  reviewerId: true,
  coAssignees: true,
  observers: true,
  trashedAt: true,
} as const;

/**
 * Task access runs before create/relink/reuse. MESSENGER.VIEW ALL does not skip this.
 * `access` undefined is the agent/ops path after a separate authorization check.
 */
export async function requireTaskEntityAccess(
  prisma: PrismaLike,
  taskId: string,
  access: TasksAccessContext | undefined,
): Promise<TaskEnsureRow> {
  await assertTaskAccessible(prisma, taskId, access);
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: TASK_ENSURE_SELECT,
  });
  if (!task || task.trashedAt) throw new NotFoundException(TASK_NOT_FOUND);
  return task;
}

/** Internal GET / persist: Task conversation 404s unless the caller may open that Task. */
export async function requireTaskConversationAccess(
  prisma: PrismaLike,
  conversationId: string,
  access: TasksAccessContext,
): Promise<void> {
  const link = await prisma.messengerConversationLink.findFirst({
    where: { conversationId, entityType: 'TASK', relationType: 'PRIMARY' },
    select: { entityId: true },
  });
  if (!link) throw new NotFoundException(CONVERSATION_NOT_FOUND);
  await requireTaskEntityAccess(prisma, link.entityId, access);
}
