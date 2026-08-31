import { PrismaClient, classifyDatabaseError, type InputJsonValue } from '@nbos/database';
import { persistCoreMessage } from './messenger-core-message.ops';
import { mapCoreMessage } from './messenger-core-message-map';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import { ensureWhatsAppClientConversation } from './messenger-wa-ensure.ops';
import { isWhatsAppChatId, whatsAppInboundIdempotencyKey } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type WhatsAppInboundMessageInput = {
  accountId: string;
  chatId: string;
  providerMessageId: string;
  body: string;
  senderName: string;
  fromMe: boolean;
  createdAt: Date;
  title?: string | null;
};

export type WhatsAppInboundPersistResult = {
  conversationId: string;
  message: MessengerCoreMessageDto | null;
  created: boolean;
  skipped: boolean;
  skipReason: string | null;
};

export async function persistWhatsAppInboundMessage(
  prisma: PrismaLike,
  input: WhatsAppInboundMessageInput,
): Promise<WhatsAppInboundPersistResult> {
  if (!isWhatsAppChatId(input.chatId) || input.fromMe) {
    return skipped(input.fromMe ? 'FROM_ME_ECHO' : 'INVALID_CHAT_ID');
  }
  const ensured = await ensureWhatsAppClientConversation(prisma, {
    accountId: input.accountId,
    chatId: input.chatId,
    title: input.title ?? input.senderName,
  });
  if (ensured.zone !== 'CLIENT') {
    return skipped('INTERNAL_ZONE_FORBIDDEN', { conversationId: ensured.id });
  }
  const replayed = await findInboundByIdempotency(prisma, ensured.id, input);
  if (replayed) return replayed;
  try {
    const message = await persistCoreMessage(prisma, inboundPersistInput(ensured.id, input), []);
    await upsertInboundExternalRef(prisma, message.id, input);
    return {
      conversationId: ensured.id,
      message,
      created: true,
      skipped: false,
      skipReason: null,
    };
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    const raced = await findInboundByIdempotency(prisma, ensured.id, input);
    if (raced) return raced;
    throw error;
  }
}

async function findInboundByIdempotency(
  prisma: PrismaLike,
  conversationId: string,
  input: WhatsAppInboundMessageInput,
): Promise<WhatsAppInboundPersistResult | null> {
  const already = await prisma.messengerMessage.findUnique({
    where: {
      conversationId_idempotencyKey: {
        conversationId,
        idempotencyKey: whatsAppInboundIdempotencyKey(input.accountId, input.providerMessageId),
      },
    },
    include: { attachments: true, mentions: true, referencesAsTarget: true },
  });
  if (!already) return null;
  await upsertInboundExternalRef(prisma, already.id, input);
  return {
    conversationId,
    message: mapCoreMessage(already),
    created: false,
    skipped: false,
    skipReason: null,
  };
}

function inboundPersistInput(conversationId: string, input: WhatsAppInboundMessageInput) {
  return {
    conversationId,
    senderId: null,
    senderNameSnapshot: input.senderName,
    content: input.body,
    direction: 'INBOUND' as const,
    provenance: 'PROVIDER' as const,
    createdAt: input.createdAt,
    idempotencyKey: whatsAppInboundIdempotencyKey(input.accountId, input.providerMessageId),
    metadata: {
      provider: 'WHATSAPP',
      providerMessageId: input.providerMessageId,
      accountId: input.accountId,
    } satisfies InputJsonValue,
  };
}

async function upsertInboundExternalRef(
  prisma: PrismaLike,
  messageId: string,
  input: WhatsAppInboundMessageInput,
): Promise<void> {
  await prisma.messengerMessageExternalRef.createMany({
    data: [
      {
        messageId,
        provider: 'WHATSAPP',
        externalAccountId: input.accountId,
        externalMessageId: input.providerMessageId,
      },
    ],
    skipDuplicates: true,
  });
}

function skipped(
  skipReason: string,
  extra?: { conversationId?: string },
): WhatsAppInboundPersistResult {
  return {
    conversationId: extra?.conversationId ?? '',
    message: null,
    created: false,
    skipped: true,
    skipReason,
  };
}
