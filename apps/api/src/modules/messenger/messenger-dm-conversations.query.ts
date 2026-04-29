import type { PrismaClient } from '@nbos/database';
import { mapPrismaDmMessageToDto } from './messenger-prisma-message.mapper';
import { countDmUnreadForEmployee } from './messenger-read-state.ops';
import type { MessengerDmConversationDto } from './messenger.types';

export async function loadMessengerDmConversations(
  prisma: PrismaClient,
  userId: string,
): Promise<MessengerDmConversationDto[]> {
  const threads = await prisma.messengerDirectThread.findMany({
    where: {
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  const result: MessengerDmConversationDto[] = [];
  for (const t of threads) {
    const last = t.messages[0];
    if (!last) continue;
    const recipientId = t.participantAId === userId ? t.participantBId : t.participantAId;
    const unreadCount = await countDmUnreadForEmployee(prisma, t.id, userId);
    result.push({
      recipientId,
      lastMessage: mapPrismaDmMessageToDto(last, t.id),
      unreadCount,
    });
  }
  result.sort((x, y) => y.lastMessage.createdAt.getTime() - x.lastMessage.createdAt.getTime());
  return result;
}
