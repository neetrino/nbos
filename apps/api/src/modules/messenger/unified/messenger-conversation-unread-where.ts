import type { Prisma } from '@nbos/database';

/** Unified conversation messages from others after the viewer's read cursor. */
export function messengerConversationUnreadWhere(
  conversationId: string,
  employeeId: string,
  lastReadAt: Date | undefined,
): Prisma.MessengerMessageWhereInput {
  const base: Prisma.MessengerMessageWhereInput = {
    conversationId,
    deletedAt: null,
    OR: [{ senderId: { not: employeeId } }, { senderId: null }],
  };
  if (lastReadAt === undefined) return base;
  return { ...base, createdAt: { gt: lastReadAt } };
}
