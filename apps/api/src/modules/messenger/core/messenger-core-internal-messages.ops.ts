import { PrismaClient } from '@nbos/database';
import { MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE } from './messenger-core.constants';
import type { MessengerInternalMessagePage } from './messenger-core-internal.types';
import { mapCoreMessage } from './messenger-core-message-map';
import { hiddenTaskDiscussionNoteWhere } from './messenger-task-discussion.metadata';

type PrismaLike = InstanceType<typeof PrismaClient>;

export function latestPeerReadAt(rows: readonly { lastReadAt: Date }[]): string | null {
  let latest: Date | null = null;
  for (const row of rows) {
    if (!latest || row.lastReadAt > latest) latest = row.lastReadAt;
  }
  return latest ? latest.toISOString() : null;
}

export async function listCoreConversationMessages(
  prisma: PrismaLike,
  conversationId: string,
  query: { before?: string; pageSize?: number },
  options?: { excludeHiddenTaskNotes?: boolean; viewerId?: string },
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
  const peerLastReadAt = options?.viewerId
    ? await readPeerCursor(prisma, conversationId, options.viewerId)
    : undefined;
  return {
    items: chronological.map((row) => mapCoreMessage(row)),
    meta: {
      hasMoreOlder: rows.length === pageSize,
      pageSize,
      ...(peerLastReadAt !== undefined ? { peerLastReadAt } : {}),
    },
  };
}

async function readPeerCursor(
  prisma: PrismaLike,
  conversationId: string,
  viewerId: string,
): Promise<string | null> {
  const rows = await prisma.messengerConversationReadState.findMany({
    where: { conversationId, employeeId: { not: viewerId } },
    select: { lastReadAt: true },
  });
  return latestPeerReadAt(rows);
}
