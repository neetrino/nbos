import type { PrismaClient } from '@nbos/database';
import type { MessengerMessageDto } from '../messenger.types';

export type MessengerUnifiedMessageDto = Omit<MessengerMessageDto, 'channelId'> & {
  conversationId: string;
};

export function mapPrismaUnifiedMessageToDto(m: {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderNameSnapshot: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  attachments?: Array<{ id: string; fileAssetId: string; createdAt: Date }>;
}): MessengerUnifiedMessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId ?? '',
    senderName: m.senderNameSnapshot,
    content: m.content,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    attachments: (m.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      fileAssetId: attachment.fileAssetId,
      createdAt: attachment.createdAt,
    })),
  };
}

/** Also expose as legacy MessageDto shape (channelId = conversationId) for WS dual-emit. */
export function mapUnifiedMessageToLegacyDto(
  m: MessengerUnifiedMessageDto,
): MessengerMessageDto {
  return {
    id: m.id,
    channelId: m.conversationId,
    senderId: m.senderId,
    senderName: m.senderName,
    content: m.content,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    attachments: m.attachments,
  };
}

export async function loadMessengerConversationMessageWindow(
  prisma: PrismaClient,
  conversationId: string,
  opts: { before?: Date; limit: number },
): Promise<{
  rowsAsc: Array<{
    id: string;
    conversationId: string;
    senderId: string | null;
    senderNameSnapshot: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    attachments: Array<{ id: string; fileAssetId: string; createdAt: Date }>;
  }>;
  hasMoreOlder: boolean;
}> {
  const rowsDesc = await prisma.messengerMessage.findMany({
    where: {
      conversationId,
      deletedAt: null,
      ...(opts.before ? { createdAt: { lt: opts.before } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: opts.limit + 1,
    include: { attachments: true },
  });
  const hasMoreOlder = rowsDesc.length > opts.limit;
  const page = hasMoreOlder ? rowsDesc.slice(0, opts.limit) : rowsDesc;
  return { rowsAsc: page.reverse(), hasMoreOlder };
}
