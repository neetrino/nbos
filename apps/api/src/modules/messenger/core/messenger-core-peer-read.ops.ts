import { PrismaClient } from '@nbos/database';
import type { MessengerWsConversationPeerReadPayload } from '@nbos/shared';

type PrismaLike = Pick<PrismaClient, 'messengerConversationParticipant'>;

export async function notifyCoreConversationPeerRead(
  prisma: PrismaLike,
  emit: (employeeId: string, payload: MessengerWsConversationPeerReadPayload) => void,
  input: { conversationId: string; readerId: string; lastReadAt: string },
): Promise<void> {
  const peers = await prisma.messengerConversationParticipant.findMany({
    where: {
      conversationId: input.conversationId,
      leftAt: null,
      employeeId: { not: input.readerId },
    },
    select: { employeeId: true },
  });
  const payload: MessengerWsConversationPeerReadPayload = {
    conversationId: input.conversationId,
    readerId: input.readerId,
    lastReadAt: input.lastReadAt,
  };
  for (const peer of peers) emit(peer.employeeId, payload);
}
