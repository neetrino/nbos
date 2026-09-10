import type { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import {
  parseWhatsAppSendCommandPayload,
  whatsAppSendCommandPayloadsMatch,
} from './messenger-core-command-payload';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export const MESSENGER_COMMAND_OPEN_STATUSES = ['PENDING', 'OUTCOME_UNKNOWN'] as const;

export const CANONICAL_WHATSAPP_COMMAND_SELECT = {
  id: true,
  conversationId: true,
  resultMessageId: true,
  idempotencyKey: true,
  kind: true,
  status: true,
  payload: true,
  firstAttemptAt: true,
  createdAt: true,
  invalidReason: true,
  nextReconcileAt: true,
  dispatchToken: true,
  dispatchClaimedAt: true,
} as const;

export type CanonicalWhatsAppCommand = {
  id: string;
  conversationId: string | null;
  resultMessageId: string | null;
  idempotencyKey: string;
  kind: string;
  status: string;
  payload: unknown;
  firstAttemptAt: Date | null;
  createdAt: Date;
  invalidReason: string | null;
  nextReconcileAt: Date | null;
  dispatchToken: string | null;
  dispatchClaimedAt: Date | null;
};

export async function loadCanonicalWhatsAppCommand(
  prisma: PrismaLike,
  idempotencyKey: string,
): Promise<CanonicalWhatsAppCommand | null> {
  return prisma.messengerCommand.findUnique({
    where: { idempotencyKey },
    select: CANONICAL_WHATSAPP_COMMAND_SELECT,
  });
}

const MANUAL_REVIEW_REASONS: readonly string[] = [
  MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED,
  MESSENGER_COMMAND_INVALID_REASON.PROVIDER_REF_CONFLICT,
];

export function isCanonicalCommandTerminal(command: CanonicalWhatsAppCommand): boolean {
  if (command.status === 'COMPLETED' || command.status === 'FAILED') return true;
  return (
    command.status === 'OUTCOME_UNKNOWN' &&
    command.invalidReason != null &&
    MANUAL_REVIEW_REASONS.includes(command.invalidReason)
  );
}

export function canonicalCommandMatchesJob(
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
): boolean {
  if (command.kind !== 'SEND_MESSAGE') return false;
  if (command.resultMessageId !== job.messageId) return false;
  if (command.conversationId !== job.conversationId) return false;
  const canonical = whatsAppOutboundIdempotencyKey(job.messageId);
  if (command.idempotencyKey !== canonical || job.idempotencyKey !== canonical) return false;
  const parsed = parseWhatsAppSendCommandPayload(command.payload);
  if (!parsed) return false;
  return whatsAppSendCommandPayloadsMatch(parsed, {
    accountId: job.accountId,
    chatId: job.chatId,
  });
}

/** Null when the persisted row cannot form a canonical SEND_MESSAGE job. */
export function tryCanonicalWhatsAppSendJob(
  row: CanonicalWhatsAppCommand,
): WhatsAppCoreSendJobPayload | null {
  if (!row.conversationId || !row.resultMessageId) return null;
  const payload = parseWhatsAppSendCommandPayload(row.payload);
  if (!payload) return null;
  const job: WhatsAppCoreSendJobPayload = {
    kind: 'core_client_send',
    chatId: payload.chatId,
    accountId: payload.accountId,
    messageId: row.resultMessageId,
    conversationId: row.conversationId,
    idempotencyKey: row.idempotencyKey,
  };
  return canonicalCommandMatchesJob(row, job) ? job : null;
}

export function openCanonicalCommandWhere(command: CanonicalWhatsAppCommand) {
  return {
    id: command.id,
    idempotencyKey: command.idempotencyKey,
    kind: 'SEND_MESSAGE' as const,
    resultMessageId: command.resultMessageId,
    conversationId: command.conversationId,
    status: { in: [...MESSENGER_COMMAND_OPEN_STATUSES] },
    NOT: {
      status: 'OUTCOME_UNKNOWN' as const,
      invalidReason: { in: [...MANUAL_REVIEW_REASONS] },
    },
  };
}

/** ACK/ref proof may complete UNKNOWN, including manual-review rows. */
export function isActiveDispatchClaim(
  command: Pick<CanonicalWhatsAppCommand, 'dispatchToken' | 'nextReconcileAt'>,
  now: Date,
): boolean {
  return (
    command.dispatchToken != null &&
    command.nextReconcileAt != null &&
    command.nextReconcileAt.getTime() > now.getTime()
  );
}

export function proofCompleteCommandWhere(messageId: string) {
  return {
    idempotencyKey: whatsAppOutboundIdempotencyKey(messageId),
    kind: 'SEND_MESSAGE' as const,
    resultMessageId: messageId,
    status: { in: [...MESSENGER_COMMAND_OPEN_STATUSES] },
  };
}
