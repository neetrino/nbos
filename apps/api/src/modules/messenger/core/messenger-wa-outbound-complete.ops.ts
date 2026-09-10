import { PrismaClient, type MessengerMessageStatus } from '@nbos/database';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import { messengerWorkerAuditActor } from './messenger-outbound-audit';
import { WHATSAPP_CORE_UNKNOWN_RECONCILE_MS } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';
import {
  type CanonicalWhatsAppCommand,
  isCanonicalCommandTerminal,
} from './messenger-outbound-command-canonical';
import {
  type DispatchOwnership,
  MessengerOutboundOutcomeRollback,
  workerTokenCommandWhere,
} from './messenger-outbound-command-claim';
import { persistAcceptedWhatsAppRef } from './messenger-wa-outbound-ref-proof.ops';
import { reduceWhatsAppOutboundOutcome } from './messenger-outbound-outcome-reducer';

type PrismaLike = InstanceType<typeof PrismaClient>;

const MISSING_PROVIDER_MESSAGE_ID_CODE = 'HTTP_503';

export async function completeCoreSend(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  providerMessageId: string | null,
  recovering: boolean,
  publisher?: MessengerDeliveryStatusPublisher,
  token?: string,
): Promise<void> {
  if (!providerMessageId) {
    if (recovering && token) {
      await scheduleWhatsAppUnknownReconcile(prisma, command, token);
      return;
    }
    if (recovering) return;
    throw new WhatsAppGatewayHttpError(
      503,
      MISSING_PROVIDER_MESSAGE_ID_CODE,
      'WhatsApp Gateway send returned no provider message id',
    );
  }
  try {
    const published = await runMessengerWriteTx(prisma, (tx) =>
      persistAcceptedWhatsAppRef(tx, command, job, providerMessageId, token),
    );
    await publishIfChanged(publisher, job, published);
  } catch (error) {
    if (error instanceof MessengerOutboundOutcomeRollback) return;
    throw error;
  }
}

export async function setCoreSendStatus(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: Pick<WhatsAppCoreSendJobPayload, 'messageId' | 'conversationId'>,
  status: 'FAILED' | 'OUTCOME_UNKNOWN',
  errorCode: string,
  publisher?: MessengerDeliveryStatusPublisher,
  ownership: DispatchOwnership = { kind: 'scheduler', snapshot: command },
): Promise<void> {
  if (isCanonicalCommandTerminal(command)) return;
  const published = await runMessengerWriteTx(prisma, async (tx) => {
    const result = await reduceWhatsAppOutboundOutcome(
      tx,
      command,
      job,
      ownership,
      status === 'FAILED'
        ? { type: 'failed', errorCode }
        : { type: 'unknown', errorCode, reschedule: true },
      messengerWorkerAuditActor(),
    );
    return result.published;
  });
  await publishIfChanged(publisher, job, published);
}

export { casOutboundStatus } from './messenger-wa-outbound-cas';

export async function scheduleWhatsAppUnknownReconcile(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand | string,
  token?: string,
): Promise<void> {
  const now = new Date();
  const nextReconcileAt = new Date(now.getTime() + WHATSAPP_CORE_UNKNOWN_RECONCILE_MS);
  if (typeof command === 'string') {
    await prisma.messengerCommand.updateMany({
      where: { idempotencyKey: command, status: 'OUTCOME_UNKNOWN', dispatchToken: null },
      data: { nextReconcileAt },
    });
    return;
  }
  if (!token) return;
  await prisma.messengerCommand.updateMany({
    where: workerTokenCommandWhere(command, token, now),
    data: { nextReconcileAt },
  });
}

export async function publishIfChanged(
  publisher: MessengerDeliveryStatusPublisher | undefined,
  job: Pick<WhatsAppCoreSendJobPayload, 'messageId' | 'conversationId'>,
  published: MessengerMessageStatus | null | false | 'sent' | 'noop' | 'conflict',
): Promise<void> {
  if (!publisher || published == null || published === false || published === 'noop') return;
  const status = published === 'sent' ? 'SENT' : published === 'conflict' ? 'OUTCOME_UNKNOWN' : published;
  await publisher.publish({
    conversationId: job.conversationId,
    messageId: job.messageId,
    status,
    occurredAt: new Date().toISOString(),
  });
}

