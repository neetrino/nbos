import type { WhatsAppDestinationVerdict } from '../../integrations/whatsapp-gateway/whatsapp-destination-access';
import { WHATSAPP_ERROR } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { parseWhatsAppSendCommandPayload } from './messenger-core-command-payload';
import {
  isNeverAttemptedQueuedSend,
  isWithinWhatsAppSameKeyWindow,
} from './messenger-outbound-gateway-window';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';
import { WHATSAPP_FALLBACK_ACCOUNT_ID } from './product-communication.constants';

/** Operator-approved reroute. Logical `core-wa-send:<messageId>` stays unchanged. */
export const LEGACY_REPAIR_GENERATION = 1;

const PROVEN_PRE_PROVIDER_CODES = new Set<string>([
  WHATSAPP_ERROR.NOT_CONNECTED,
  WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED,
  MESSENGER_COMMAND_INVALID_REASON.FORGED_ROUTING,
]);

const AMBIGUOUS_FAILURE_CODES = new Set<string>([
  'WAHA_UNAVAILABLE',
  'HTTP_502',
  'HTTP_503',
  'HTTP_504',
  'MESSAGE_OUTCOME_UNKNOWN',
  WHATSAPP_ERROR.GATEWAY_UNAVAILABLE,
  WHATSAPP_ERROR.CORE_SEND_OUTCOME_UNKNOWN,
  'timeout',
  MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED,
]);

export type LegacyRepairFailureReason =
  | 'unknown_previous_outcome'
  | 'gateway_window_expired_unsafe'
  | 'provider_acceptance_not_disproven';

type FailureInput = {
  status: string;
  errorCode: string | null;
  invalidReason: string | null;
  firstAttemptAt: Date | null;
  createdAt: Date;
};

/**
 * Allowlist only. A FAILED command is safe to reroute when the stored code proves
 * the provider never accepted the message.
 */
export function isSafeForExplicitLegacyResend(command: {
  status: string;
  errorCode: string | null;
  invalidReason: string | null;
}): boolean {
  if (command.status !== 'FAILED') return false;
  const code = command.errorCode;
  if (!code || !PROVEN_PRE_PROVIDER_CODES.has(code)) return false;
  if (command.invalidReason != null && command.invalidReason !== code) return false;
  return true;
}

/** Null means the failure is proven safe for an explicit legacy repair. */
export function classifyLegacyRepairFailure(
  command: FailureInput,
  now = new Date(),
): LegacyRepairFailureReason | null {
  if (isSafeForExplicitLegacyResend(command)) return null;
  if (command.status === 'OUTCOME_UNKNOWN' || isAmbiguousFailure(command)) {
    return 'unknown_previous_outcome';
  }
  if (!isWithinWhatsAppSameKeyWindow(command, now)) return 'gateway_window_expired_unsafe';
  return 'provider_acceptance_not_disproven';
}

export function legacyRepairPayload(
  accountId: string,
  chatId: string,
): {
  accountId: string;
  chatId: string;
  repairGeneration: number;
} {
  return { accountId, chatId, repairGeneration: LEGACY_REPAIR_GENERATION };
}

export function readLegacyRepairGeneration(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const value = (payload as Record<string, unknown>).repairGeneration;
  return value === LEGACY_REPAIR_GENERATION ? LEGACY_REPAIR_GENERATION : null;
}

/** True when an old firstAttemptAt must stop this dispatch. Proven repair QUEUED sends are exempt. */
export function blocksExpiredSameKeyWindow(
  command: { status: string; payload: unknown; firstAttemptAt: Date | null; createdAt: Date },
  messageStatus: string,
  now: Date,
): boolean {
  if (isNeverAttemptedQueuedSend(command.firstAttemptAt, messageStatus)) return false;
  if (isExplicitLegacyRepairDispatch(command, messageStatus)) return false;
  return !isWithinWhatsAppSameKeyWindow(command, now);
}

/**
 * The one operator-approved QUEUED dispatch may start after the original window
 * expired. Later same-generation retries stay on that window.
 */
export function isExplicitLegacyRepairDispatch(
  command: { status: string; payload: unknown },
  messageStatus: string,
): boolean {
  return (
    command.status === 'PENDING' &&
    messageStatus === 'QUEUED' &&
    readLegacyRepairGeneration(command.payload) === LEGACY_REPAIR_GENERATION
  );
}

/**
 * Logical key stays `core-wa-send:<messageId>`. Once `repairGeneration` is stored,
 * every Gateway call for that generation uses the same `:repair:N` header, including
 * `OUTCOME_UNKNOWN` recovery. The 24h window is enforced before this key is sent.
 */
export function whatsAppTransportIdempotencyKey(
  command: { payload: unknown },
  logicalKey: string,
  messageId: string,
): string {
  const generation = readLegacyRepairGeneration(command.payload);
  if (generation == null) return logicalKey;
  if (logicalKey !== whatsAppOutboundIdempotencyKey(messageId)) return logicalKey;
  return `${logicalKey}:repair:${generation}`;
}

type RepairGuardInput = {
  command: {
    kind: string;
    status: string;
    conversationId: string | null;
    resultMessageId: string | null;
    idempotencyKey: string;
    payload: unknown;
    dispatchToken: string | null;
  } | null;
  message: {
    id: string;
    conversationId: string;
    deletedAt: Date | null;
  } | null;
  mapping: { externalAccountId: string; externalConversationId: string } | null;
};

export function rejectLegacyRepairStructure(
  input: RepairGuardInput,
): { action: 'reject'; reason: string } | null {
  const command = input.command;
  const message = input.message;
  const payload = parseWhatsAppSendCommandPayload(command?.payload);
  if (!command || command.kind !== 'SEND_MESSAGE')
    return { action: 'reject', reason: 'not_core_send' };
  if (command.status !== 'FAILED' && command.status !== 'OUTCOME_UNKNOWN') {
    return { action: 'reject', reason: 'command_not_failed' };
  }
  if (command.dispatchToken) return { action: 'reject', reason: 'dispatch_in_progress' };
  if (!message || message.deletedAt) return { action: 'reject', reason: 'missing_message' };
  if (message.conversationId !== command.conversationId) {
    return { action: 'reject', reason: 'conversation_mismatch' };
  }
  if (command.resultMessageId !== message.id)
    return { action: 'reject', reason: 'message_identity' };
  if (command.idempotencyKey !== whatsAppOutboundIdempotencyKey(message.id)) {
    return { action: 'reject', reason: 'idempotency_mismatch' };
  }
  if (!payload) return { action: 'reject', reason: 'malformed_payload' };
  if (payload.accountId !== WHATSAPP_FALLBACK_ACCOUNT_ID) {
    return { action: 'reject', reason: 'not_legacy_account' };
  }
  return rejectLegacyRepairMapping(input.mapping, payload.chatId);
}

export function rejectLegacyRepairDestination(
  destination: WhatsAppDestinationVerdict,
): { action: 'reject' | 'manual_review'; reason: string } | null {
  if (destination === 'account_mismatch')
    return { action: 'manual_review', reason: 'account_mismatch' };
  if (destination === 'account_unknown') {
    return { action: 'manual_review', reason: 'account_identity_unavailable' };
  }
  if (destination === 'missing') return { action: 'reject', reason: 'group_not_accessible' };
  if (destination !== 'accessible') return { action: 'reject', reason: 'gateway_unavailable' };
  return null;
}

function rejectLegacyRepairMapping(
  mapping: RepairGuardInput['mapping'],
  chatId: string,
): { action: 'reject'; reason: string } | null {
  if (!mapping) return { action: 'reject', reason: 'missing_mapping' };
  if (
    !mapping.externalAccountId.trim() ||
    mapping.externalAccountId === WHATSAPP_FALLBACK_ACCOUNT_ID
  ) {
    return { action: 'reject', reason: 'current_account_not_real' };
  }
  if (chatId !== mapping.externalConversationId)
    return { action: 'reject', reason: 'chat_mismatch' };
  return null;
}

function isAmbiguousFailure(command: FailureInput): boolean {
  if (command.errorCode && AMBIGUOUS_FAILURE_CODES.has(command.errorCode)) return true;
  return command.invalidReason != null && AMBIGUOUS_FAILURE_CODES.has(command.invalidReason);
}
