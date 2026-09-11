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
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { finalizeWhatsAppTerminalMessageSkip } from './messenger-outbound-message-skip.ops';
import { prepareWhatsAppCoreSend } from './messenger-wa-outbound-prepare.ops';
import { completeCoreSend, setCoreSendStatus } from './messenger-wa-outbound-complete.ops';
import { beginWhatsAppCoreSendAttempt } from './messenger-wa-outbound-attempt.ops';
import { repairWhatsAppRefProof } from './messenger-wa-outbound-repair.ops';
import {
  type CanonicalWhatsAppCommand,
  canonicalCommandMatchesJob,
  isCanonicalCommandTerminal,
  loadCanonicalWhatsAppCommand,
} from './messenger-outbound-command-canonical';
import { recordWhatsAppSendPayloadConflict } from './messenger-outbound-payload-conflict.ops';
import {
  isNeverAttemptedQueuedSend,
  isWithinWhatsAppSameKeyWindow,
} from './messenger-outbound-gateway-window';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

const STUCK_FOR_EXHAUSTION: readonly MessengerMessageStatus[] = ['QUEUED', 'SENDING'];

export async function dispatchWhatsAppCoreSendJob(
  prisma: PrismaLike,
  connection: WhatsAppGatewayConnectionService,
  client: WhatsAppGatewayClient,
  job: WhatsAppCoreSendJobPayload,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<void> {
  const command = await loadCanonicalWhatsAppCommand(prisma, job.idempotencyKey);
  if (!command || !canonicalCommandMatchesJob(command, job)) {
    await recordWhatsAppSendPayloadConflict(prisma, command, job);
    return;
  }
  const prepared = await prepareWhatsAppCoreSend(prisma, job);
  if (await stopBeforeGateway(prisma, command, job, prepared, publisher)) return;
  if (prepared.kind !== 'ready') return;
  if (!isNeverAttemptedQueuedSend(command.firstAttemptAt, prepared.message.status)) {
    if (!isWithinWhatsAppSameKeyWindow(command, new Date())) {
      await markWhatsAppCommandInvalid(
        prisma,
        command,
        job,
        MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED,
        undefined,
        publisher,
      );
      return;
    }
  }
  const attempt = await beginWhatsAppCoreSendAttempt(
    prisma,
    command,
    job,
    prepared.message.status,
    publisher,
  );
  if (attempt.kind === 'stop') return;
  await submitPreparedWhatsAppSend(
    prisma,
    connection,
    client,
    command,
    job,
    prepared,
    publisher,
    attempt.token,
  );
}

async function stopBeforeGateway(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  prepared: Awaited<ReturnType<typeof prepareWhatsAppCoreSend>>,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<boolean> {
  if (prepared.kind === 'skip') {
    await finalizeWhatsAppTerminalMessageSkip(
      prisma,
      command,
      job,
      { kind: 'scheduler', snapshot: command },
      publisher,
    );
    return true;
  }
  if (prepared.kind === 'repair') {
    await repairWhatsAppRefProof(prisma, command, job, publisher);
    return true;
  }
  if (isCanonicalCommandTerminal(command)) return true;
  if (prepared.kind === 'invalid') {
    await markWhatsAppCommandInvalid(prisma, command, job, prepared.reason, undefined, publisher);
    return true;
  }
  return false;
}

async function submitPreparedWhatsAppSend(
  prisma: PrismaLike,
  connection: WhatsAppGatewayConnectionService,
  client: WhatsAppGatewayClient,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  prepared: Extract<Awaited<ReturnType<typeof prepareWhatsAppCoreSend>>, { kind: 'ready' }>,
  publisher?: MessengerDeliveryStatusPublisher,
  token?: string,
): Promise<void> {
  try {
    const config = await connection.requireClientConfig();
    const result = await client.sendAccountTextMessage(
      config,
      prepared.accountId,
      { chatId: prepared.chatId, text: prepared.message.content },
      job.idempotencyKey,
    );
    await completeCoreSend(
      prisma,
      command,
      job,
      readProviderMessageId(result.messageId),
      prepared.recovering,
      publisher,
      token,
    );
  } catch (error) {
    await failOrUnknownCoreSend(prisma, command, job, error, publisher, token);
  }
}

function readProviderMessageId(messageId: string | undefined): string | null {
  const trimmed = messageId?.trim();
  return trimmed ? trimmed : null;
}

async function failOrUnknownCoreSend(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  error: unknown,
  publisher?: MessengerDeliveryStatusPublisher,
  token?: string,
): Promise<void> {
  const code = readGatewayErrorCode(error);
  const ownership = token ? { kind: 'worker' as const, token } : undefined;
  if (isMessageOutcomeUnknown(code)) {
    await setCoreSendStatus(prisma, command, job, 'OUTCOME_UNKNOWN', code, publisher, ownership);
    return;
  }
  if (isProvenSendFailure(code)) {
    await setCoreSendStatus(prisma, command, job, 'FAILED', code, publisher, ownership);
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

export async function markWhatsAppCoreSendExhausted(
  prisma: PrismaLike,
  messageId: string,
  error: unknown,
  conversationId?: string,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<void> {
  const message = await prisma.messengerMessage.findUnique({
    where: { id: messageId },
    select: { status: true, conversationId: true },
  });
  if (!message || !STUCK_FOR_EXHAUSTION.includes(message.status)) return;
  const command = await loadCanonicalWhatsAppCommand(
    prisma,
    whatsAppOutboundIdempotencyKey(messageId),
  );
  if (!command || isCanonicalCommandTerminal(command)) return;
  if (command.resultMessageId !== messageId) return;
  const code = readGatewayErrorCode(error);
  const next = isExhaustedSendUnknown(code, error) ? 'OUTCOME_UNKNOWN' : 'FAILED';
  await setCoreSendStatus(
    prisma,
    command,
    { messageId, conversationId: conversationId ?? message.conversationId },
    next,
    code,
    publisher,
  );
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
