import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { mapCoreMessage } from './messenger-core-message-map';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import type { MessengerConversationType, MessengerConversationZone } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerCoreSourceMessageDto = MessengerCoreMessageDto & {
  zone: MessengerConversationZone;
  conversationType: MessengerConversationType;
};

export async function loadCoreSourceMessage(
  prisma: PrismaLike,
  messageId: string,
): Promise<{ conversationId: string } & MessengerCoreSourceMessageDto> {
  const row = await prisma.messengerMessage.findUnique({
    where: { id: messageId },
    include: {
      attachments: true,
      mentions: { select: { employeeId: true } },
      referencesAsTarget: true,
      conversation: { select: { zone: true, type: true } },
    },
  });
  if (!row || row.deletedAt) throw new NotFoundException('Message not found');
  return {
    ...mapCoreMessage(row),
    conversationId: row.conversationId,
    zone: row.conversation.zone,
    conversationType: row.conversation.type,
  };
}
