import { ForbiddenException } from '@nestjs/common';
import { PrismaClient, type MessengerExternalProvider } from '@nbos/database';
import { MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN } from './messenger-core.constants';
import { isInternalZone } from './messenger-core-zone';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function createCoreExternalMapping(
  prisma: PrismaLike,
  input: {
    conversationId: string;
    provider: MessengerExternalProvider;
    providerAccountId: string;
    providerConversationId: string;
  },
): Promise<{ id: string }> {
  const conversation = await prisma.messengerConversation.findUniqueOrThrow({
    where: { id: input.conversationId },
    select: { id: true, zone: true },
  });
  if (isInternalZone(conversation.zone)) {
    throw new ForbiddenException(MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN);
  }
  const created = await prisma.messengerExternalConversationMapping.create({
    data: {
      conversationId: conversation.id,
      provider: input.provider,
      externalAccountId: input.providerAccountId,
      externalConversationId: input.providerConversationId,
    },
    select: { id: true },
  });
  return created;
}
