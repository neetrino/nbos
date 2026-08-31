import { Logger } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { mapCoreMessage } from './messenger-core-message-map';
import { createCoreProviderSendOutbox } from './messenger-core-outbox.ops';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import { isWhatsAppChatId, whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

const logger = new Logger('WhatsAppCoreOutbound');

type PrismaLike = InstanceType<typeof PrismaClient>;

export type WhatsAppMappingRef = {
  externalAccountId: string;
  externalConversationId: string;
};

export async function findClientWhatsAppMapping(
  prisma: PrismaLike,
  conversationId: string,
): Promise<WhatsAppMappingRef | null> {
  const mapping = await prisma.messengerExternalConversationMapping.findFirst({
    where: { conversationId, provider: 'WHATSAPP' },
    select: {
      externalAccountId: true,
      externalConversationId: true,
      conversation: { select: { zone: true } },
    },
  });
  if (!mapping || mapping.conversation.zone !== 'CLIENT') return null;
  if (!isWhatsAppChatId(mapping.externalConversationId)) return null;
  return {
    externalAccountId: mapping.externalAccountId,
    externalConversationId: mapping.externalConversationId,
  };
}

export async function enqueueWhatsAppCoreSend(
  prisma: PrismaLike,
  queue: WhatsAppOutboundQueueService | undefined,
  input: {
    message: MessengerCoreMessageDto;
    actorEmployeeId: string;
    mapping: WhatsAppMappingRef;
  },
): Promise<void> {
  if (input.message.direction !== 'OUTBOUND') return;
  const idempotencyKey = whatsAppOutboundIdempotencyKey(input.message.id);
  await createCoreProviderSendOutbox(prisma, {
    conversationId: input.message.conversationId,
    messageId: input.message.id,
    idempotencyKey,
    createdById: input.actorEmployeeId,
    payload: {
      accountId: input.mapping.externalAccountId,
      chatId: input.mapping.externalConversationId,
    } satisfies InputJsonValue,
  });
  await offerWhatsAppCoreSendJob(queue, {
    kind: 'core_client_send',
    chatId: input.mapping.externalConversationId,
    accountId: input.mapping.externalAccountId,
    messageId: input.message.id,
    conversationId: input.message.conversationId,
    idempotencyKey,
  });
}

async function offerWhatsAppCoreSendJob(
  queue: WhatsAppOutboundQueueService | undefined,
  payload: WhatsAppCoreSendJobPayload,
): Promise<void> {
  if (!queue?.isAvailable()) return;
  try {
    await queue.enqueue(payload, false);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown';
    logger.warn(
      `WhatsApp core send enqueue failed after outbox; leaving PENDING messageId=${payload.messageId} (${detail})`,
    );
  }
}

export async function finalizeWhatsAppCoreOutbound(
  prisma: PrismaLike,
  queue: WhatsAppOutboundQueueService | undefined,
  message: MessengerCoreMessageDto,
  actorEmployeeId: string,
  mapping: WhatsAppMappingRef | null,
): Promise<MessengerCoreMessageDto> {
  if (!mapping || message.direction !== 'OUTBOUND') return message;
  await enqueueWhatsAppCoreSend(prisma, queue, { message, actorEmployeeId, mapping });
  return (await reloadCoreMessage(prisma, message.id)) ?? message;
}

async function reloadCoreMessage(
  prisma: PrismaLike,
  messageId: string,
): Promise<MessengerCoreMessageDto | null> {
  const row = await prisma.messengerMessage.findUnique({
    where: { id: messageId },
    include: { attachments: true, mentions: true, referencesAsTarget: true },
  });
  return row ? mapCoreMessage(row) : null;
}
