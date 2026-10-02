import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { bumpGlobalConversationRevision } from './messenger-core-revision-write.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * Advances the existing zone revision in the caller's write transaction.
 * Callers publish only after that transaction commits.
 */
export async function commitWhatsAppMessageRevision(
  prisma: PrismaLike,
  conversationId: string,
): Promise<void> {
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { zone: true },
  });
  if (!conversation) throw new NotFoundException('Conversation not found');
  await bumpGlobalConversationRevision(prisma, conversation.zone, conversationId);
}
