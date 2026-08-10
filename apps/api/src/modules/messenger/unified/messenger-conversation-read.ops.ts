import type { PrismaClient } from '@nbos/database';
import { messengerConversationUnreadWhere } from './messenger-conversation-unread-where';

export async function countConversationUnreadForEmployee(
  prisma: PrismaClient,
  conversationId: string,
  employeeId: string,
): Promise<number> {
  const row = await prisma.messengerConversationReadState.findUnique({
    where: { conversationId_employeeId: { conversationId, employeeId } },
    select: { lastReadAt: true },
  });
  return prisma.messengerMessage.count({
    where: messengerConversationUnreadWhere(conversationId, employeeId, row?.lastReadAt),
  });
}

export async function markConversationReadForEmployee(
  prisma: PrismaClient,
  conversationId: string,
  employeeId: string,
): Promise<Date> {
  const latest = await prisma.messengerMessage.findFirst({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const lastReadAt = latest?.createdAt ?? new Date();
  await prisma.messengerConversationReadState.upsert({
    where: { conversationId_employeeId: { conversationId, employeeId } },
    create: { conversationId, employeeId, lastReadAt },
    update: { lastReadAt },
  });
  return lastReadAt;
}

export async function getConversationLastOwnReadReceipt(
  prisma: PrismaClient,
  conversationId: string,
  viewerId: string,
): Promise<{ lastOwnMessageId: string | null; lastOwnMessageSeenByOthers: boolean }> {
  const lastOwn = await prisma.messengerMessage.findFirst({
    where: { conversationId, senderId: viewerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true },
  });
  if (!lastOwn) {
    return { lastOwnMessageId: null, lastOwnMessageSeenByOthers: false };
  }
  const peerSeen = await prisma.messengerConversationReadState.findFirst({
    where: {
      conversationId,
      employeeId: { not: viewerId },
      lastReadAt: { gte: lastOwn.createdAt },
    },
    select: { id: true },
  });
  return {
    lastOwnMessageId: lastOwn.id,
    lastOwnMessageSeenByOthers: Boolean(peerSeen),
  };
}
