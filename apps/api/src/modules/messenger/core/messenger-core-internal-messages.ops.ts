import { PrismaClient } from '@nbos/database';
import { MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE } from './messenger-core.constants';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import type { MessengerInternalMessagePage } from './messenger-core-internal.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listCoreConversationMessages(
  prisma: PrismaLike,
  conversationId: string,
  query: { before?: string; pageSize?: number },
): Promise<MessengerInternalMessagePage> {
  const pageSize = query.pageSize ?? MESSENGER_CORE_INTERNAL_MESSAGE_PAGE_SIZE;
  const before = query.before ? new Date(query.before) : null;
  const rows = await prisma.messengerMessage.findMany({
    where: {
      conversationId,
      deletedAt: null,
      ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    include: { attachments: true },
  });
  const chronological = [...rows].reverse();
  return {
    items: chronological.map(mapMessage),
    meta: { hasMoreOlder: rows.length === pageSize, pageSize },
  };
}

function mapMessage(row: {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderNameSnapshot: string;
  content: string;
  direction: MessengerCoreMessageDto['direction'];
  status: MessengerCoreMessageDto['status'];
  provenance: MessengerCoreMessageDto['provenance'];
  replyToMessageId: string | null;
  threadRootMessageId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  attachments: Array<{ id: string; fileAssetId: string; createdAt: Date }>;
}): MessengerCoreMessageDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName: row.senderNameSnapshot,
    content: row.content,
    direction: row.direction,
    status: row.status,
    provenance: row.provenance,
    replyToMessageId: row.replyToMessageId,
    threadRootMessageId: row.threadRootMessageId,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      fileAssetId: attachment.fileAssetId,
      createdAt: attachment.createdAt,
    })),
  };
}
