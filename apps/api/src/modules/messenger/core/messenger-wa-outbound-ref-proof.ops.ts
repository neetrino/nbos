import type { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { messengerWorkerAuditActor } from './messenger-outbound-audit';
import { type CanonicalWhatsAppCommand } from './messenger-outbound-command-canonical';
import {
  type DispatchOwnership,
  MessengerOutboundOutcomeRollback,
} from './messenger-outbound-command-claim';
import {
  lockAndAuthorizeCommand,
  lockedCommandMatchesResolvedMessage,
  ownsLockedCommand,
} from './messenger-outbound-command-lock';
import { recordWhatsAppSendIdentityConflict } from './messenger-outbound-payload-conflict.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { applyLockedWhatsAppOutboundOutcome } from './messenger-outbound-outcome-reducer';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type AcceptedWhatsAppRef = 'sent' | 'noop' | 'conflict' | false;

export async function persistAcceptedWhatsAppRef(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  providerMessageId: string,
  token?: string,
): Promise<AcceptedWhatsAppRef> {
  const now = new Date();
  const live = await lockAndAuthorizeCommand(prisma, command, { kind: 'proof' }, now);
  if (!live) return false;
  if (!lockedCommandMatchesResolvedMessage(live, job)) {
    await recordWhatsAppSendIdentityConflict(prisma, job);
    return false;
  }
  const proof = await proveWhatsAppRefOwnership(prisma, job, providerMessageId);
  if (proof.kind === 'conflict') {
    return applyProviderRefConflict(prisma, live, job, token, now);
  }
  const result = await applyLockedWhatsAppOutboundOutcome(
    prisma,
    live,
    job,
    { type: 'complete' },
    messengerWorkerAuditActor(),
  );
  if (result.won) return result.published === 'SENT' ? 'sent' : 'noop';
  if (proof.inserted) throw new MessengerOutboundOutcomeRollback();
  return false;
}

async function applyProviderRefConflict(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  token: string | undefined,
  now: Date,
): Promise<AcceptedWhatsAppRef> {
  if (!token) return false;
  const ownership: DispatchOwnership = { kind: 'worker', token };
  if (!ownsLockedCommand(live, ownership, now)) return false;
  const reason = MESSENGER_COMMAND_INVALID_REASON.PROVIDER_REF_CONFLICT;
  const result = await applyLockedWhatsAppOutboundOutcome(
    prisma,
    live,
    job,
    { type: 'unknown', errorCode: reason, invalidReason: reason, reschedule: false },
    messengerWorkerAuditActor(),
  );
  if (!result.won) return false;
  return result.published === 'OUTCOME_UNKNOWN' ? 'conflict' : false;
}

async function proveWhatsAppRefOwnership(
  prisma: PrismaLike,
  job: WhatsAppCoreSendJobPayload,
  providerMessageId: string,
): Promise<{ kind: 'ok'; inserted: boolean } | { kind: 'conflict' }> {
  const existingForMessage = await prisma.messengerMessageExternalRef.findFirst({
    where: { messageId: job.messageId, provider: 'WHATSAPP' },
    select: { externalMessageId: true, externalAccountId: true },
  });
  if (
    existingForMessage &&
    (existingForMessage.externalMessageId !== providerMessageId ||
      existingForMessage.externalAccountId !== job.accountId)
  ) {
    return { kind: 'conflict' };
  }
  const inserted = await prisma.messengerMessageExternalRef.createMany({
    data: [
      {
        messageId: job.messageId,
        provider: 'WHATSAPP',
        externalAccountId: job.accountId,
        externalMessageId: providerMessageId,
      },
    ],
    skipDuplicates: true,
  });
  const owned = await prisma.messengerMessageExternalRef.findUnique({
    where: {
      provider_externalAccountId_externalMessageId: {
        provider: 'WHATSAPP',
        externalAccountId: job.accountId,
        externalMessageId: providerMessageId,
      },
    },
    select: { messageId: true },
  });
  if (!owned || owned.messageId !== job.messageId) return { kind: 'conflict' };
  return { kind: 'ok', inserted: inserted.count === 1 };
}
