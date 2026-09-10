import type { ActorContext } from '@nbos/shared';
import type { MessengerMessageStatus, PrismaClient } from '@nbos/database';
import { WHATSAPP_CORE_UNKNOWN_RECONCILE_MS } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import {
  MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED,
  MESSENGER_AUDIT_EXTERNAL_SEND_FAILED,
  MESSENGER_AUDIT_EXTERNAL_SEND_INVALID,
  MESSENGER_AUDIT_EXTERNAL_SEND_UNKNOWN,
  writeMessengerExternalSendAudit,
} from './messenger-outbound-audit';
import { type CanonicalWhatsAppCommand } from './messenger-outbound-command-canonical';
import {
  CLEAR_DISPATCH_CLAIM,
  type DispatchOwnership,
  isWhatsAppProofMessageStatus,
  MessengerOutboundOutcomeRollback,
} from './messenger-outbound-command-claim';
import { lockAndAuthorizeCommand, lockedCommandMatchesResolvedMessage } from './messenger-outbound-command-lock';
import { casOutboundStatus, casOwnedProofStatus } from './messenger-wa-outbound-cas';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type OutboundReduceIntent =
  | { type: 'complete' }
  | { type: 'failed'; errorCode: string }
  | { type: 'unknown'; errorCode: string; invalidReason?: string | null; reschedule?: boolean }
  | { type: 'invalid'; commandStatus: 'FAILED' | 'OUTCOME_UNKNOWN'; reason: string };

export type ReduceOutcomeResult = {
  won: boolean;
  published: MessengerMessageStatus | null;
};

export async function reduceWhatsAppOutboundOutcome(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  ownership: DispatchOwnership,
  intent: OutboundReduceIntent,
  actor: ActorContext,
): Promise<ReduceOutcomeResult> {
  const live = await lockAndAuthorizeCommand(prisma, command, ownership, new Date());
  if (!live || !lockedCommandAllowsOutcome(live, job, intent)) {
    return { won: false, published: null };
  }
  return applyLockedWhatsAppOutboundOutcome(prisma, live, job, intent, actor);
}

export async function applyLockedWhatsAppOutboundOutcome(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  intent: OutboundReduceIntent,
  actor: ActorContext,
): Promise<ReduceOutcomeResult> {
  if (!lockedCommandAllowsOutcome(live, job, intent)) {
    return { won: false, published: null };
  }
  const current = await loadMessageStatus(prisma, job.messageId);
  if (intent.type === 'complete') {
    return finishProofComplete(prisma, live, job, actor, current);
  }
  if (current && isWhatsAppProofMessageStatus(current)) {
    const completed = await completeLockedCommand(prisma, live, job, actor, undefined);
    return { won: completed || live.status === 'COMPLETED', published: null };
  }
  return {
    won: true,
    published: await finishNonProof(prisma, live, job, actor, intent, current),
  };
}

async function finishProofComplete(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  actor: ActorContext,
  current: string | null,
): Promise<ReduceOutcomeResult> {
  if (current === 'CANCELLED') {
    await completeLockedCommand(prisma, live, job, actor, undefined);
    return { won: true, published: null };
  }
  if (current && isWhatsAppProofMessageStatus(current)) {
    await completeLockedCommand(prisma, live, job, actor, undefined);
    return { won: true, published: null };
  }
  const advanced = await casOwnedProofStatus(prisma, job.messageId, 'SENT');
  if (advanced) {
    await completeLockedCommand(prisma, live, job, actor, 'SENT');
    return { won: true, published: 'SENT' };
  }
  const reloaded = await loadMessageStatus(prisma, job.messageId);
  if (reloaded === 'CANCELLED') {
    await completeLockedCommand(prisma, live, job, actor, undefined);
    return { won: true, published: null };
  }
  if (reloaded && isWhatsAppProofMessageStatus(reloaded)) {
    await completeLockedCommand(prisma, live, job, actor, undefined);
    return { won: true, published: null };
  }
  if (live.status === 'COMPLETED') return { won: true, published: null };
  return { won: false, published: null };
}

async function finishNonProof(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  actor: ActorContext,
  intent: Exclude<OutboundReduceIntent, { type: 'complete' }>,
  current: string | null,
): Promise<MessengerMessageStatus | null> {
  if (current === 'CANCELLED' || current === 'FAILED') {
    await persistNonProofCommand(prisma, live, job, actor, intent, undefined);
    return null;
  }
  const next = nonProofMessageStatus(intent);
  const wrote = await writeNonProofMessage(prisma, live, job, next);
  if (!wrote && current && isWhatsAppProofMessageStatus(current)) {
    await completeLockedCommand(prisma, live, job, actor, undefined);
    return null;
  }
  if (!wrote) {
    const reloaded = await loadMessageStatus(prisma, job.messageId);
    if (reloaded && isWhatsAppProofMessageStatus(reloaded)) {
      await completeLockedCommand(prisma, live, job, actor, undefined);
      return null;
    }
    if (reloaded === 'CANCELLED' || reloaded === 'FAILED') {
      await persistNonProofCommand(prisma, live, job, actor, intent, undefined);
      return null;
    }
    const paired =
      live.resultMessageId != null &&
      live.resultMessageId === job.messageId &&
      live.conversationId === job.conversationId;
    if (paired && reloaded != null && reloaded !== next) {
      throw new MessengerOutboundOutcomeRollback();
    }
  }
  await persistNonProofCommand(prisma, live, job, actor, intent, wrote ? next : undefined);
  return wrote ? next : null;
}

export async function completeLockedCommand(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  actor: ActorContext,
  messageStatus: MessengerMessageStatus | undefined,
): Promise<boolean> {
  if (!lockedCommandMatchesResolvedMessage(live, job)) return false;
  if (live.status === 'COMPLETED') return false;
  await prisma.messengerCommand.update({
    where: { id: live.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      errorCode: null,
      invalidReason: null,
      nextReconcileAt: null,
      ...CLEAR_DISPATCH_CLAIM,
    },
  });
  await writeMessengerExternalSendAudit(prisma, {
    messageId: job.messageId,
    conversationId: job.conversationId,
    action: MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED,
    actor,
    commandStatus: 'COMPLETED',
    messageStatus,
  });
  return true;
}

async function persistNonProofCommand(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  actor: ActorContext,
  intent: Exclude<OutboundReduceIntent, { type: 'complete' }>,
  messageStatus: MessengerMessageStatus | undefined,
): Promise<void> {
  const resolved = resolveNonProofCommand(intent);
  await prisma.messengerCommand.update({
    where: { id: live.id },
    data: {
      status: resolved.status,
      errorCode: resolved.errorCode,
      invalidReason: resolved.invalidReason,
      completedAt: resolved.status === 'FAILED' ? new Date() : null,
      nextReconcileAt: resolved.nextReconcileAt,
      ...CLEAR_DISPATCH_CLAIM,
    },
  });
  await writeMessengerExternalSendAudit(prisma, {
    messageId: job.messageId,
    conversationId: job.conversationId,
    action: auditActionFor(intent),
    actor,
    commandStatus: resolved.status,
    messageStatus,
    errorCode: resolved.errorCode,
    invalidReason: resolved.invalidReason,
  });
}

function resolveNonProofCommand(intent: Exclude<OutboundReduceIntent, { type: 'complete' }>): {
  status: 'FAILED' | 'OUTCOME_UNKNOWN';
  errorCode: string;
  invalidReason: string | null;
  nextReconcileAt: Date | null;
} {
  if (intent.type === 'failed') {
    return { status: 'FAILED', errorCode: intent.errorCode, invalidReason: null, nextReconcileAt: null };
  }
  if (intent.type === 'invalid') {
    return {
      status: intent.commandStatus,
      errorCode: intent.reason,
      invalidReason: intent.reason,
      nextReconcileAt: null,
    };
  }
  return {
    status: 'OUTCOME_UNKNOWN',
    errorCode: intent.errorCode,
    invalidReason: intent.invalidReason ?? null,
    nextReconcileAt: intent.reschedule
      ? new Date(Date.now() + WHATSAPP_CORE_UNKNOWN_RECONCILE_MS)
      : null,
  };
}

function nonProofMessageStatus(
  intent: Exclude<OutboundReduceIntent, { type: 'complete' }>,
): MessengerMessageStatus {
  if (intent.type === 'failed') return 'FAILED';
  if (intent.type === 'invalid') {
    return intent.commandStatus === 'FAILED' ? 'FAILED' : 'OUTCOME_UNKNOWN';
  }
  return 'OUTCOME_UNKNOWN';
}

function auditActionFor(intent: Exclude<OutboundReduceIntent, { type: 'complete' }>): string {
  if (intent.type === 'failed') return MESSENGER_AUDIT_EXTERNAL_SEND_FAILED;
  if (intent.type === 'invalid') return MESSENGER_AUDIT_EXTERNAL_SEND_INVALID;
  return MESSENGER_AUDIT_EXTERNAL_SEND_UNKNOWN;
}

async function writeNonProofMessage(
  prisma: PrismaLike,
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string },
  status: MessengerMessageStatus,
): Promise<boolean> {
  if (!live.resultMessageId || live.resultMessageId !== job.messageId) return false;
  if (live.conversationId && live.conversationId !== job.conversationId) return false;
  if (status !== 'FAILED' && status !== 'OUTCOME_UNKNOWN') return false;
  return casOutboundStatus(prisma, job.messageId, status);
}

function lockedCommandAllowsOutcome(
  live: CanonicalWhatsAppCommand,
  job: { messageId: string; conversationId: string; idempotencyKey?: string },
  intent: OutboundReduceIntent,
): boolean {
  if (intent.type === 'complete') {
    return lockedCommandMatchesResolvedMessage(live, job);
  }
  if (live.kind !== 'SEND_MESSAGE') return false;
  if (live.resultMessageId == null) return true;
  return live.resultMessageId === job.messageId && live.conversationId === job.conversationId;
}

async function loadMessageStatus(prisma: PrismaLike, messageId: string): Promise<string | null> {
  const row = await prisma.messengerMessage.findUnique({
    where: { id: messageId },
    select: { status: true },
  });
  return row?.status ?? null;
}
