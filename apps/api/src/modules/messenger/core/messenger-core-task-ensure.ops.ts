import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { taskCanonicalKey } from './messenger-core-canonical-key';
import {
  attachEntityIdentity,
  findOrCreateEntityConversation,
  mapEntityConversation,
  type EntityConversationCreateInput,
} from './messenger-core-entity-create.ops';
import { participantSeedsForTask } from './messenger-core-entity-participants.ops';
import { requireTaskEntityAccess, type TaskEnsureRow } from './messenger-core-task-access.ops';
import { taskLegacyIdentity } from './messenger-legacy-identity';
import type { MessengerEntityEnsureResult } from './messenger-core.types';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * Lazy Task conversation. Call only when discussion begins or when backfilling rows.
 * Does not read or write the leftover Task chat column.
 */
export async function ensureTaskConversation(
  prisma: PrismaLike,
  taskId: string,
  access: TasksAccessContext | undefined,
  openerEmployeeId?: string,
): Promise<MessengerEntityEnsureResult> {
  const task = await requireTaskEntityAccess(prisma, taskId, access);
  const input = taskCreateInput(task, openerEmployeeId);
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey: input.canonicalKey },
  });
  if (existing) {
    await attachEntityIdentity(prisma, existing.id, input.links, input.participants);
    await attachTaskLegacyIdentity(prisma, existing.id, task.id);
    return { ...mapEntityConversation(existing), created: false, linkedLegacyConversationId: null };
  }
  const created = await findOrCreateEntityConversation(prisma, input);
  if (!created.created) {
    await attachEntityIdentity(prisma, created.row.id, input.links, input.participants);
  }
  await attachTaskLegacyIdentity(prisma, created.row.id, task.id);
  return { ...created.row, created: created.created, linkedLegacyConversationId: null };
}

function taskCreateInput(
  task: TaskEnsureRow,
  openerEmployeeId: string | undefined,
): EntityConversationCreateInput {
  const createdById = openerEmployeeId ?? task.creatorId;
  return {
    type: 'TASK',
    title: task.title,
    createdById,
    canonicalKey: taskCanonicalKey(task.id),
    metadata: { taskId: task.id } as InputJsonValue,
    links: [{ entityType: 'TASK', entityId: task.id, relationType: 'PRIMARY' }],
    participants: participantSeedsForTask(task, openerEmployeeId),
  };
}

async function attachTaskLegacyIdentity(
  prisma: PrismaLike,
  conversationId: string,
  taskId: string,
): Promise<void> {
  await prisma.messengerLegacyIdentity.createMany({
    data: [{ ...taskLegacyIdentity(taskId), conversationId }],
    skipDuplicates: true,
  });
}
