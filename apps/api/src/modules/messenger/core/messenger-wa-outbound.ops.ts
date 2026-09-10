import { ConflictException, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { MESSENGER_CORE_COMMAND_CONFLICT } from './messenger-core.constants';
import { parseWhatsAppSendCommandPayload } from './messenger-core-command-payload';
import { mapCoreMessage } from './messenger-core-message-map';
import { ensureWhatsAppSendCommand } from './messenger-core-outbox.ops';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import { isWhatsAppChatId, whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

const logger = new Logger('WhatsAppCoreOutbound');

type PrismaLike = InstanceType<typeof PrismaClient>;

export type WhatsAppMappingRef = {
  externalAccountId: string;
  externalConversationId: string;
};

export type PersistWhatsAppSendIntent = {
  mapping: WhatsAppMappingRef;
  actorEmployeeId?: string;
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

export async function reuseOrRepairWhatsAppSendCommand(
  prisma: PrismaLike,
  message: {
    id: string;
    conversationId: string;
    direction: string;
    status: string;
    deletedAt?: Date | null;
  },
  whatsAppSend: PersistWhatsAppSendIntent | undefined,
): Promise<void> {
  if (message.direction !== 'OUTBOUND') return;
  const existing = await prisma.messengerCommand.findUnique({
    where: { idempotencyKey: whatsAppOutboundIdempotencyKey(message.id) },
    select: { kind: true, resultMessageId: true, conversationId: true, payload: true },
  });
  if (existing) {
    const identityOk =
      existing.kind === 'SEND_MESSAGE' &&
      existing.resultMessageId === message.id &&
      existing.conversationId === message.conversationId;
    if (!identityOk) throw new ConflictException(MESSENGER_CORE_COMMAND_CONFLICT);
    return;
  }
  if (!whatsAppSend || message.status !== 'QUEUED' || message.deletedAt) return;
  await persistWhatsAppSendCommandInTx(prisma, {
    conversationId: message.conversationId,
    messageId: message.id,
    mapping: whatsAppSend.mapping,
    actorEmployeeId: whatsAppSend.actorEmployeeId,
    allowCreate: true,
  });
}

export async function persistWhatsAppSendCommandInTx(
  prisma: PrismaLike,
  input: {
    conversationId: string;
    messageId: string;
    mapping: WhatsAppMappingRef;
    actorEmployeeId?: string;
    allowCreate: boolean;
  },
): Promise<void> {
  await ensureWhatsAppSendCommand(prisma, {
    conversationId: input.conversationId,
    messageId: input.messageId,
    idempotencyKey: whatsAppOutboundIdempotencyKey(input.messageId),
    payload: {
      accountId: input.mapping.externalAccountId,
      chatId: input.mapping.externalConversationId,
    },
    createdById: input.actorEmployeeId,
    allowCreate: input.allowCreate,
  });
}

export async function offerWhatsAppCoreSendJob(
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

export function whatsAppCoreSendJobFromMessage(
  message: Pick<MessengerCoreMessageDto, 'id' | 'conversationId'>,
  mapping: WhatsAppMappingRef,
): WhatsAppCoreSendJobPayload {
  return {
    kind: 'core_client_send',
    chatId: mapping.externalConversationId,
    accountId: mapping.externalAccountId,
    messageId: message.id,
    conversationId: message.conversationId,
    idempotencyKey: whatsAppOutboundIdempotencyKey(message.id),
  };
}

export async function enqueueWhatsAppCoreSend(
  prisma: PrismaLike,
  queue: WhatsAppOutboundQueueService | undefined,
  input: {
    message: MessengerCoreMessageDto;
    actorEmployeeId?: string;
    mapping: WhatsAppMappingRef;
  },
): Promise<void> {
  if (input.message.direction !== 'OUTBOUND') return;
  await persistWhatsAppSendCommandInTx(prisma, {
    conversationId: input.message.conversationId,
    messageId: input.message.id,
    mapping: input.mapping,
    actorEmployeeId: input.actorEmployeeId,
    allowCreate: true,
  });
  await offerWhatsAppCoreSendJob(queue, whatsAppCoreSendJobFromMessage(input.message, input.mapping));
}

export async function finalizeWhatsAppCoreOutbound(
  prisma: PrismaLike,
  queue: WhatsAppOutboundQueueService | undefined,
  message: MessengerCoreMessageDto,
  _actorEmployeeId: string | undefined,
  mapping: WhatsAppMappingRef | null,
): Promise<MessengerCoreMessageDto> {
  if (message.direction !== 'OUTBOUND') return message;
  const job = await coreSendJobFromCanonicalCommand(prisma, message, mapping);
  if (job) await offerWhatsAppCoreSendJob(queue, job);
  return (await reloadCoreMessage(prisma, message.id)) ?? message;
}

async function coreSendJobFromCanonicalCommand(
  prisma: PrismaLike,
  message: MessengerCoreMessageDto,
  mapping: WhatsAppMappingRef | null,
): Promise<WhatsAppCoreSendJobPayload | null> {
  const command = await prisma.messengerCommand.findUnique({
    where: { idempotencyKey: whatsAppOutboundIdempotencyKey(message.id) },
    select: { kind: true, resultMessageId: true, conversationId: true, payload: true },
  });
  if (command) {
    if (
      command.kind !== 'SEND_MESSAGE' ||
      command.resultMessageId !== message.id ||
      command.conversationId !== message.conversationId
    ) {
      return null;
    }
    const payload = parseWhatsAppSendCommandPayload(command.payload);
    if (!payload) return null;
    return whatsAppCoreSendJobFromMessage(message, {
      externalAccountId: payload.accountId,
      externalConversationId: payload.chatId,
    });
  }
  if (!mapping) return null;
  return whatsAppCoreSendJobFromMessage(message, mapping);
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
