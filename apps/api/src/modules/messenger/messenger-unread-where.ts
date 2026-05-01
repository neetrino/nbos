import { type Prisma } from '@nbos/database';

/** Messages from others after the viewer's read cursor (no row => entire history unread). */
export function messengerChannelUnreadWhere(
  channelId: string,
  employeeId: string,
  lastReadAt: Date | undefined,
): Prisma.MessengerChannelMessageWhereInput {
  const base: Prisma.MessengerChannelMessageWhereInput = {
    channelId,
    senderId: { not: employeeId },
  };
  if (lastReadAt === undefined) return base;
  return { ...base, createdAt: { gt: lastReadAt } };
}

/** DM messages from the peer after the viewer's read cursor. */
export function messengerDmUnreadWhere(
  threadId: string,
  employeeId: string,
  lastReadAt: Date | undefined,
): Prisma.MessengerDirectMessageWhereInput {
  const base: Prisma.MessengerDirectMessageWhereInput = {
    threadId,
    senderId: { not: employeeId },
  };
  if (lastReadAt === undefined) return base;
  return { ...base, createdAt: { gt: lastReadAt } };
}
