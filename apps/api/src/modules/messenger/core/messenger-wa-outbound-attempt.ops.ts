import type { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';
import {
  type CanonicalWhatsAppCommand,
  isCanonicalCommandTerminal,
  loadCanonicalWhatsAppCommand,
} from './messenger-outbound-command-canonical';
import {
  claimWhatsAppDispatch,
  MessengerOutboundClaimAborted,
} from './messenger-outbound-command-claim';
import { isWithinWhatsAppSameKeyWindow } from './messenger-outbound-gateway-window';
import { prepareWhatsAppCoreSend } from './messenger-wa-outbound-prepare.ops';
import { repairWhatsAppRefProof } from './messenger-wa-outbound-repair.ops';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { finalizeWhatsAppTerminalMessageSkip } from './messenger-outbound-message-skip.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type WhatsAppSendAttemptResult =
  | { kind: 'proceed'; token: string }
  | { kind: 'stop' };

/**
 * Acquire an exclusive dispatch token. TX commits before Gateway HTTP.
 */
export async function beginWhatsAppCoreSendAttempt(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  messageStatus: string,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<WhatsAppSendAttemptResult> {
  let claimed: { token: string; transitionedToSending: boolean } | null;
  try {
    claimed = await runMessengerWriteTx(prisma, (tx) =>
      persistDispatchClaim(tx, command, job, messageStatus),
    );
  } catch (error) {
    if (error instanceof MessengerOutboundClaimAborted) return { kind: 'stop' };
    throw error;
  }
  if (!claimed) return { kind: 'stop' };
  if (claimed.transitionedToSending) {
    await publisher?.publish({
      conversationId: job.conversationId,
      messageId: job.messageId,
      status: 'SENDING',
      occurredAt: new Date().toISOString(),
    });
  }
  const blocked = await revalidateAfterDispatchClaim(prisma, command, job, claimed.token, publisher);
  if (blocked) return { kind: 'stop' };
  return { kind: 'proceed', token: claimed.token };
}

async function persistDispatchClaim(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  messageStatus: string,
): Promise<{ token: string; transitionedToSending: boolean } | null> {
  if (messageStatus !== 'QUEUED' && !isRecoverableSendStatus(messageStatus)) return null;
  const now = new Date();
  if (messageStatus !== 'QUEUED' && !isWithinWhatsAppSameKeyWindow(command, now)) {
    return null;
  }
  const token = await claimWhatsAppDispatch(prisma, command, messageStatus, now);
  if (!token) return null;
  const live = await loadCanonicalWhatsAppCommand(prisma, command.idempotencyKey);
  if (!live || isCanonicalCommandTerminal(live)) throw new MessengerOutboundClaimAborted();
  if (messageStatus !== 'QUEUED' && !isWithinWhatsAppSameKeyWindow(live, now)) {
    throw new MessengerOutboundClaimAborted();
  }
  if (messageStatus !== 'QUEUED') return { token, transitionedToSending: false };
  const wrote = await prisma.messengerMessage.updateMany({
    where: { id: job.messageId, conversationId: job.conversationId, status: 'QUEUED' },
    data: { status: 'SENDING' },
  });
  if (wrote.count === 0) throw new MessengerOutboundClaimAborted();
  return { token, transitionedToSending: true };
}

async function revalidateAfterDispatchClaim(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  token: string,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<boolean> {
  const prepared = await prepareWhatsAppCoreSend(prisma, job);
  if (prepared.kind === 'repair') {
    await repairWhatsAppRefProof(prisma, command, job, publisher);
    return true;
  }
  if (prepared.kind === 'invalid') {
    await markWhatsAppCommandInvalid(
      prisma,
      command,
      job,
      prepared.reason,
      undefined,
      publisher,
      { kind: 'worker', token },
    );
    return true;
  }
  if (prepared.kind === 'skip') {
    await finalizeWhatsAppTerminalMessageSkip(
      prisma,
      command,
      job,
      { kind: 'worker', token },
      publisher,
    );
    return true;
  }
  return prepared.kind !== 'ready';
}

function isRecoverableSendStatus(status: string): boolean {
  return (
    status === 'SENDING' ||
    status === 'OUTCOME_UNKNOWN' ||
    status === 'SENT' ||
    status === 'DELIVERED' ||
    status === 'READ'
  );
}
