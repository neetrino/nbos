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
    data: mappingData(conversation.id, input),
    select: { id: true },
  });
  return created;
}

export async function upsertCoreExternalMapping(
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
  return prisma.messengerExternalConversationMapping.upsert({
    where: {
      provider_externalAccountId_externalConversationId: {
        provider: input.provider,
        externalAccountId: input.providerAccountId,
        externalConversationId: input.providerConversationId,
      },
    },
    create: mappingData(conversation.id, input),
    update: { conversationId: conversation.id },
    select: { id: true },
  });
}

function mappingData(
  conversationId: string,
  input: {
    provider: MessengerExternalProvider;
    providerAccountId: string;
    providerConversationId: string;
  },
) {
  return {
    conversationId,
    provider: input.provider,
    externalAccountId: input.providerAccountId,
    externalConversationId: input.providerConversationId,
  };
}
