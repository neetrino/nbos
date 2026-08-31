import { HttpException } from '@nestjs/common';
import { PrismaClient, type MessengerMessageStatus } from '@nbos/database';
import { WhatsAppGatewayClient } from '../../integrations/whatsapp-gateway/whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from '../../integrations/whatsapp-gateway/whatsapp-gateway-connection.service';
import {
  isMessageOutcomeUnknown,
  isRetryableGatewayError,
  WhatsAppGatewayHttpError,
} from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { WHATSAPP_ERROR } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import {
  whatsAppOutboundIdempotencyKey,
  whatsAppStatusesAllowedForOutboundWrite,
  type WhatsAppOutboundCasStatus,
} from './messenger-wa-identity';
import { bumpWhatsAppUnknownReconcileClock } from './messenger-wa-outbound-drain.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

const TERMINAL_OK: readonly MessengerMessageStatus[] = ['SENT', 'DELIVERED', 'READ', 'CANCELLED'];
const RECOVER_REF_STATUSES: readonly MessengerMessageStatus[] = [
  'SENT',
  'DELIVERED',
  'READ',
  'OUTCOME_UNKNOWN',
];
const STUCK_FOR_EXHAUSTION: readonly MessengerMessageStatus[] = ['QUEUED', 'SENDING'];
const MISSING_PROVIDER_MESSAGE_ID_CODE = 'HTTP_503';

export async function dispatchWhatsAppCoreSendJob(
  prisma: PrismaLike,
  connection: WhatsAppGatewayConnectionService,
  client: WhatsAppGatewayClient,
  job: WhatsAppCoreSendJobPayload,
): Promise<void> {
  const message = await loadCoreSendMessage(prisma, job);
  if (!message) return;
  const hasRef = await hasWhatsAppOutboundRef(prisma, message.id);
  if (shouldSkipCoreSend(message.status, hasRef)) return;
  const recovering = isMissingRefRecovery(message.status, hasRef);
  if (!recovering && !(await casOutboundStatus(prisma, message.id, 'SENDING'))) return;
  try {
    const config = await connection.requireClientConfig();
    const result = await client.sendAccountTextMessage(
      config,
      job.accountId,
      { chatId: job.chatId, text: message.content },
      job.idempotencyKey,
    );
    await completeCoreSend(
      prisma,
      message.id,
      readProviderMessageId(result.messageId),
      job,
      recovering,
    );
  } catch (error) {
    await failOrUnknownCoreSend(prisma, message.id, error);
  }
}

async function loadCoreSendMessage(
  prisma: PrismaLike,
  job: WhatsAppCoreSendJobPayload,
): Promise<{ id: string; content: string; status: MessengerMessageStatus } | null> {
  const message = await prisma.messengerMessage.findUnique({
    where: { id: job.messageId },
    select: {
      id: true,
      conversationId: true,
      content: true,
      status: true,
      deletedAt: true,
    },
  });
  if (!message || message.deletedAt) return null;
  if (message.conversationId !== job.conversationId) return null;
  return { id: message.id, content: message.content, status: message.status };
}

async function hasWhatsAppOutboundRef(prisma: PrismaLike, messageId: string): Promise<boolean> {
  const row = await prisma.messengerMessageExternalRef.findFirst({
    where: { messageId, provider: 'WHATSAPP' },
    select: { id: true },
  });
  return row !== null;
}

function shouldSkipCoreSend(status: MessengerMessageStatus, hasRef: boolean): boolean {
  if (status === 'CANCELLED') return true;
  if (!hasRef) return false;
  return status === 'OUTCOME_UNKNOWN' || TERMINAL_OK.includes(status);
}

function isMissingRefRecovery(status: MessengerMessageStatus, hasRef: boolean): boolean {
  return !hasRef && RECOVER_REF_STATUSES.includes(status);
}

function readProviderMessageId(messageId: string | undefined): string | null {
  const trimmed = messageId?.trim();
  return trimmed ? trimmed : null;
}

async function completeCoreSend(
  prisma: PrismaLike,
  messageId: string,
  providerMessageId: string | null,
  job: WhatsAppCoreSendJobPayload,
  recovering: boolean,
): Promise<void> {
  if (!providerMessageId) {
    if (recovering) {
      await bumpWhatsAppUnknownReconcileClock(prisma, whatsAppOutboundIdempotencyKey(messageId));
      return;
    }
    throw new WhatsAppGatewayHttpError(
      503,
      MISSING_PROVIDER_MESSAGE_ID_CODE,
      'WhatsApp Gateway send returned no provider message id',
    );
  }
  await prisma.messengerMessageExternalRef.createMany({
    data: [
      {
        messageId,
        provider: 'WHATSAPP',
        externalAccountId: job.accountId,
        externalMessageId: providerMessageId,
      },
    ],
    skipDuplicates: true,
  });
  await casOutboundStatus(prisma, messageId, 'SENT');
  await prisma.messengerCommand.updateMany({
    where: { idempotencyKey: whatsAppOutboundIdempotencyKey(messageId) },
    data: { status: 'COMPLETED', completedAt: new Date(), errorCode: null },
  });
}

async function failOrUnknownCoreSend(
  prisma: PrismaLike,
  messageId: string,
  error: unknown,
): Promise<void> {
  const code = readGatewayErrorCode(error);
  if (isMessageOutcomeUnknown(code)) {
    await setCoreSendStatus(prisma, messageId, 'OUTCOME_UNKNOWN', code);
    return;
  }
  if (isProvenSendFailure(code)) {
    await setCoreSendStatus(prisma, messageId, 'FAILED', code);
    return;
  }
  throw error;
}

function isProvenSendFailure(code: string): boolean {
  return (
    code === 'WHATSAPP_NOT_CONNECTED' ||
    code === WHATSAPP_ERROR.NOT_CONNECTED ||
    code === WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED
  );
}

/** Last BullMQ attempt: do not leave SENDING/QUEUED without a terminal or unknown outcome. */
export async function markWhatsAppCoreSendExhausted(
  prisma: PrismaLike,
  messageId: string,
  error: unknown,
): Promise<void> {
  const message = await prisma.messengerMessage.findUnique({
    where: { id: messageId },
    select: { status: true },
  });
  if (!message || !STUCK_FOR_EXHAUSTION.includes(message.status)) return;
  const code = readGatewayErrorCode(error);
  if (isExhaustedSendUnknown(code, error)) {
    await setCoreSendStatus(prisma, messageId, 'OUTCOME_UNKNOWN', code);
    return;
  }
  await setCoreSendStatus(prisma, messageId, 'FAILED', code);
}

function isExhaustedSendUnknown(code: string, error: unknown): boolean {
  if (isMessageOutcomeUnknown(code)) return true;
  if (isRetryableGatewayError(code)) return true;
  return error instanceof WhatsAppGatewayHttpError && error.status >= 500;
}

function readGatewayErrorCode(error: unknown): string {
  if (error instanceof WhatsAppGatewayHttpError) return error.code;
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'object' && response && 'code' in response) {
      const code = (response as { code?: unknown }).code;
      if (typeof code === 'string') return code;
    }
  }
  return 'MESSAGE_SEND_FAILED';
}

async function casOutboundStatus(
  prisma: PrismaLike,
  messageId: string,
  status: WhatsAppOutboundCasStatus,
): Promise<boolean> {
  const result = await prisma.messengerMessage.updateMany({
    where: { id: messageId, status: { in: whatsAppStatusesAllowedForOutboundWrite(status) } },
    data: { status },
  });
  return result.count > 0;
}

async function setCoreSendStatus(
  prisma: PrismaLike,
  messageId: string,
  status: 'FAILED' | 'OUTCOME_UNKNOWN',
  errorCode: string,
): Promise<void> {
  const advanced = await casOutboundStatus(prisma, messageId, status);
  if (!advanced) return;
  await prisma.messengerCommand.updateMany({
    where: { idempotencyKey: whatsAppOutboundIdempotencyKey(messageId) },
    data: {
      status: status === 'OUTCOME_UNKNOWN' ? 'OUTCOME_UNKNOWN' : 'FAILED',
      errorCode,
      completedAt: new Date(),
    },
  });
}
