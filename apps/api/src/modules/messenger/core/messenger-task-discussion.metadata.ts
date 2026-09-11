import type { InputJsonValue, MessengerMessageProvenance, Prisma } from '@nbos/database';
import type { ActorType } from '@nbos/shared';
import { isEmployeeActorType } from '@nbos/shared';

export const TASK_DISCUSSION_VISIBILITY_STANDARD = 'STANDARD';
export const TASK_DISCUSSION_VISIBILITY_HIDDEN = 'HIDDEN';
export const TASK_DISCUSSION_ENTRY_IDEMPOTENCY_PREFIX = 'task-discussion-entry:';

export type TaskDiscussionVisibility =
  | typeof TASK_DISCUSSION_VISIBILITY_STANDARD
  | typeof TASK_DISCUSSION_VISIBILITY_HIDDEN;

export type TaskDiscussionMessageMeta = {
  actorType: string;
  actorId: string;
  channelSource: string | null;
  correlationId: string | null;
  visibility: TaskDiscussionVisibility;
};

export function taskDiscussionMetadata(meta: TaskDiscussionMessageMeta): InputJsonValue {
  return { taskDiscussion: meta };
}

export function taskDiscussionEntryIdempotencyKey(entryId: string): string {
  return `${TASK_DISCUSSION_ENTRY_IDEMPOTENCY_PREFIX}${entryId}`;
}

/** Same JSON path as Internal TASK listMessages — HIDDEN is not a normal note. */
export function hiddenTaskDiscussionNoteWhere(): Prisma.MessengerMessageWhereInput {
  return {
    NOT: {
      metadata: {
        path: ['taskDiscussion', 'visibility'],
        equals: TASK_DISCUSSION_VISIBILITY_HIDDEN,
      },
    },
  };
}

export function parseTaskDiscussionMeta(metadata: unknown): TaskDiscussionMessageMeta | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const nested = (metadata as { taskDiscussion?: unknown }).taskDiscussion;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return null;
  const row = nested as Record<string, unknown>;
  if (typeof row.actorType !== 'string' || typeof row.actorId !== 'string') return null;
  const visibility =
    row.visibility === TASK_DISCUSSION_VISIBILITY_HIDDEN
      ? TASK_DISCUSSION_VISIBILITY_HIDDEN
      : TASK_DISCUSSION_VISIBILITY_STANDARD;
  return {
    actorType: row.actorType,
    actorId: row.actorId,
    channelSource: typeof row.channelSource === 'string' ? row.channelSource : null,
    correlationId: typeof row.correlationId === 'string' ? row.correlationId : null,
    visibility,
  };
}

export function provenanceForActorType(actorType: ActorType): MessengerMessageProvenance {
  if (isEmployeeActorType(actorType)) return 'EMPLOYEE';
  if (actorType === 'EXTERNAL_AGENT' || actorType === 'INTERNAL_AI') return 'AI';
  return 'SYSTEM';
}

export function senderIdForActor(actorType: string, actorId: string): string | null {
  return actorType === 'USER' ? actorId : null;
}
