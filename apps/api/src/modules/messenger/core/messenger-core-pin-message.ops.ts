import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type PinnedMessagePreview = {
  id: string;
  senderName: string;
  content: string;
};

export async function pinCoreConversationMessage(
  prisma: PrismaLike,
  conversationId: string,
  messageId: string,
): Promise<PinnedMessagePreview> {
  const message = await prisma.messengerMessage.findFirst({
    where: { id: messageId, conversationId, deletedAt: null },
    select: { id: true, senderNameSnapshot: true, content: true },
  });
  if (!message) throw new NotFoundException('Message not found');
  await prisma.messengerConversation.update({
    where: { id: conversationId },
    data: { pinnedMessageId: message.id },
  });
  return {
    id: message.id,
    senderName: message.senderNameSnapshot,
    content: message.content,
  };
}

export async function unpinCoreConversationMessage(
  prisma: PrismaLike,
  conversationId: string,
): Promise<void> {
  const row = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { pinnedMessageId: true },
  });
  if (!row) throw new NotFoundException('Conversation not found');
  if (!row.pinnedMessageId) {
    throw new BadRequestException('No pinned message');
  }
  await prisma.messengerConversation.update({
    where: { id: conversationId },
    data: { pinnedMessageId: null },
  });
}

export function mapPinnedMessagePreview(
  row:
    | { id: string; senderNameSnapshot: string; content: string; deletedAt: Date | null }
    | null
    | undefined,
): PinnedMessagePreview | null {
  if (!row || row.deletedAt) return null;
  return { id: row.id, senderName: row.senderNameSnapshot, content: row.content };
}
