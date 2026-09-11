import type { PrismaClient, MessengerMessageStatus } from '@nbos/database';
import type { ActorContext } from '@nbos/shared';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';
import { messengerWorkerAuditActor } from './messenger-outbound-audit';
import {
  type CanonicalWhatsAppCommand,
  isCanonicalCommandTerminal,
} from './messenger-outbound-command-canonical';
import type { DispatchOwnership } from './messenger-outbound-command-claim';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import type { MessengerCommandInvalidReason } from './messenger-outbound-reconcile.constants';
import { reduceWhatsAppOutboundOutcome } from './messenger-outbound-outcome-reducer';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function markWhatsAppCommandInvalid(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: Pick<WhatsAppCoreSendJobPayload, 'messageId' | 'conversationId' | 'idempotencyKey'>,
  reason: MessengerCommandInvalidReason,
  actor: ActorContext = messengerWorkerAuditActor(),
  publisher?: MessengerDeliveryStatusPublisher,
  ownership: DispatchOwnership = { kind: 'scheduler', snapshot: command },
): Promise<void> {
  if (isCanonicalCommandTerminal(command)) return;
  const published = await runMessengerWriteTx(prisma, (tx) =>
    persistInvalidOutcome(tx, command, job, reason, actor, ownership),
  );
  if (published) {
    await publisher?.publish({
      conversationId: job.conversationId,
      messageId: job.messageId,
      status: published,
      occurredAt: new Date().toISOString(),
    });
  }
}

async function persistInvalidOutcome(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: Pick<WhatsAppCoreSendJobPayload, 'messageId' | 'conversationId'>,
  reason: MessengerCommandInvalidReason,
  actor: ActorContext,
  ownership: DispatchOwnership,
): Promise<MessengerMessageStatus | null> {
  const messageTerminal =
    reason === MESSENGER_COMMAND_INVALID_REASON.MESSAGE_CANCELLED ||
    reason === MESSENGER_COMMAND_INVALID_REASON.MESSAGE_FAILED;
  const possibleSubmit = command.firstAttemptAt != null;
  const terminalUnknown =
    !messageTerminal &&
    (reason === MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED ||
      reason === MESSENGER_COMMAND_INVALID_REASON.PROVIDER_REF_CONFLICT ||
      possibleSubmit);
  const storedReason = terminalUnknown
    ? reason === MESSENGER_COMMAND_INVALID_REASON.PROVIDER_REF_CONFLICT
      ? reason
      : MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED
    : reason;
  const result = await reduceWhatsAppOutboundOutcome(
    prisma,
    command,
    job,
    ownership,
    {
      type: 'invalid',
      commandStatus: terminalUnknown ? 'OUTCOME_UNKNOWN' : 'FAILED',
      reason: storedReason,
    },
    actor,
  );
  return result.published;
}
