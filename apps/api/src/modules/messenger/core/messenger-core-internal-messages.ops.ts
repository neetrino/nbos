import { PrismaClient } from '@nbos/database';
import { MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE } from './messenger-core.constants';
import type { MessengerInternalMessagePage } from './messenger-core-internal.types';
import { mapCoreMessage } from './messenger-core-message-map';
import { hiddenTaskDiscussionNoteWhere } from './messenger-task-discussion.metadata';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listCoreConversationMessages(
  prisma: PrismaLike,
  conversationId: string,
  query: { before?: string; pageSize?: number },
  options?: { excludeHiddenTaskNotes?: boolean },
): Promise<MessengerInternalMessagePage> {
  const pageSize = query.pageSize ?? MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE;
  const before = query.before ? new Date(query.before) : null;
  const rows = await prisma.messengerMessage.findMany({
    where: {
      conversationId,
      deletedAt: null,
      ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
      ...(options?.excludeHiddenTaskNotes ? hiddenTaskDiscussionNoteWhere() : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    include: {
      attachments: true,
      mentions: { select: { employeeId: true } },
      referencesAsTarget: { orderBy: { sortOrder: 'asc' } },
    },
  });
  const chronological = [...rows].reverse();
  return {
    items: chronological.map((row) => mapCoreMessage(row)),
    meta: { hasMoreOlder: rows.length === pageSize, pageSize },
  };
}
