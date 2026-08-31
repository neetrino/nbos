import { ConflictException } from '@nestjs/common';
import { PrismaClient, classifyDatabaseError } from '@nbos/database';
import { MESSENGER_CORE_CLIENT_ZONE } from './messenger-core.constants';
import { upsertCoreExternalMapping } from './messenger-core-mapping.ops';
import { whatsAppConversationCanonicalKey } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type WhatsAppClientEnsureInput = {
  accountId: string;
  chatId: string;
  title: string | null;
};

export type WhatsAppClientEnsureResult = {
  id: string;
  created: boolean;
  zone: 'INTERNAL' | 'CLIENT';
};

export async function ensureWhatsAppClientConversation(
  prisma: PrismaLike,
  input: WhatsAppClientEnsureInput,
): Promise<WhatsAppClientEnsureResult> {
  const proven = await findMappedWhatsAppConversation(prisma, input.accountId, input.chatId);
  if (proven) return proven;
  const created = await createOrReuseByCanonicalKey(prisma, input);
  await upsertCoreExternalMapping(prisma, {
    conversationId: created.id,
    provider: 'WHATSAPP',
    providerAccountId: input.accountId,
    providerConversationId: input.chatId,
  });
  return { ...created, zone: 'CLIENT' };
}

export async function findMappedWhatsAppConversation(
  prisma: PrismaLike,
  accountId: string,
  chatId: string,
): Promise<WhatsAppClientEnsureResult | null> {
  const mapping = await prisma.messengerExternalConversationMapping.findUnique({
    where: {
      provider_externalAccountId_externalConversationId: {
        provider: 'WHATSAPP',
        externalAccountId: accountId,
        externalConversationId: chatId,
      },
    },
    select: { conversationId: true, conversation: { select: { zone: true } } },
  });
  if (!mapping) return null;
  return {
    id: mapping.conversationId,
    created: false,
    zone: mapping.conversation.zone,
  };
}

async function createOrReuseByCanonicalKey(
  prisma: PrismaLike,
  input: WhatsAppClientEnsureInput,
): Promise<{ id: string; created: boolean }> {
  const canonicalKey = whatsAppConversationCanonicalKey(input.accountId, input.chatId);
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  try {
    const created = await prisma.messengerConversation.create({
      data: {
        zone: MESSENGER_CORE_CLIENT_ZONE,
        kind: 'EXTERNAL',
        type: 'EXTERNAL',
        title: input.title,
        canonicalKey,
        metadata: { whatsAppAccountId: input.accountId, whatsAppChatId: input.chatId },
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey },
      select: { id: true },
    });
    if (!raced) throw new ConflictException('WhatsApp Client conversation conflict');
    return { id: raced.id, created: false };
  }
}
