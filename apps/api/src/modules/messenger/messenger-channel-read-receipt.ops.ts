import type { PrismaClient } from '@nbos/database';

export interface ChannelLastOwnReadReceipt {
  lastOwnMessageId: string | null;
  lastOwnMessageSeenByOthers: boolean;
}

/**
 * Whether at least one other employee’s channel read cursor is at or after the viewer’s
 * latest message in this channel (internal MVP “seen” signal).
 */
export async function getChannelLastOwnReadReceipt(
  prisma: PrismaClient,
  channelId: string,
  viewerId: string,
): Promise<ChannelLastOwnReadReceipt> {
  const lastOwn = await prisma.messengerChannelMessage.findFirst({
    where: { channelId, senderId: viewerId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true, createdAt: true },
  });
  if (!lastOwn) {
    return { lastOwnMessageId: null, lastOwnMessageSeenByOthers: false };
  }
  const n = await prisma.messengerChannelReadState.count({
    where: {
      channelId,
      employeeId: { not: viewerId },
      lastReadAt: { gte: lastOwn.createdAt },
    },
  });
  return {
    lastOwnMessageId: lastOwn.id,
    lastOwnMessageSeenByOthers: n > 0,
  };
}
