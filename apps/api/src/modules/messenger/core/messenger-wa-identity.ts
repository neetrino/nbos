import type { MessengerMessageStatus } from '@nbos/database';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { whatsAppCanonicalKey } from './messenger-core-canonical-key';

const DIRECT_JID = /^[1-9]\d{7,14}@c\.us$/;
const GROUP_JID = /^\d{10,}(-\d+)?@g\.us$/;

export const WHATSAPP_INBOUND_EVENT_TYPES = [
  'message.received',
  'message.ack',
  'message.reaction',
  'message.edited',
  'message.revoked',
  'session.status',
] as const;

export type WhatsAppInboundEventType = (typeof WHATSAPP_INBOUND_EVENT_TYPES)[number];

export function isWhatsAppChatId(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.includes('@lid') || trimmed.includes('@s.whatsapp.net')) return false;
  return DIRECT_JID.test(trimmed) || GROUP_JID.test(trimmed);
}

export function whatsAppConversationCanonicalKey(accountId: string, chatId: string): string {
  return whatsAppCanonicalKey(accountId.trim(), chatId.trim());
}

export function whatsAppInboundIdempotencyKey(
  accountId: string,
  providerMessageId: string,
): string {
  return `core-wa-in:${accountId}:${providerMessageId}`.slice(0, 180);
}

export function whatsAppOutboundIdempotencyKey(messageId: string): string {
  return `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}${messageId}`;
}

export function mapWhatsAppAckToStatus(ack: unknown): MessengerMessageStatus | null {
  if (ack === 1 || ack === '1' || ack === 'sent' || ack === 'SENT') return 'SENT';
  if (
    ack === 2 ||
    ack === '2' ||
    ack === 'delivered' ||
    ack === 'DELIVERED' ||
    ack === 'received'
  ) {
    return 'DELIVERED';
  }
  if (ack === 3 || ack === '3' || ack === 'read' || ack === 'READ' || ack === 'played') {
    return 'READ';
  }
  return null;
}

const STATUS_RANK: Record<string, number> = {
  QUEUED: 0,
  SENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4,
};

const RANKED_WHATSAPP_STATUSES: readonly MessengerMessageStatus[] = [
  'QUEUED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'READ',
];

const ACK_REPAIR_FROM_UNKNOWN: readonly MessengerMessageStatus[] = ['SENT', 'DELIVERED', 'READ'];
const OUTBOUND_CAS_FROM: readonly MessengerMessageStatus[] = ['QUEUED', 'SENDING'];
const OWNED_PROOF_REPAIR_FROM: readonly MessengerMessageStatus[] = [
  'QUEUED',
  'SENDING',
  'OUTCOME_UNKNOWN',
  'FAILED',
];

export type WhatsAppOutboundCasStatus = 'SENDING' | 'SENT' | 'FAILED' | 'OUTCOME_UNKNOWN';

export function canAdvanceWhatsAppDelivery(
  current: MessengerMessageStatus,
  next: MessengerMessageStatus,
): boolean {
  if (current === 'FAILED' || current === 'CANCELLED') return false;
  if (current === 'OUTCOME_UNKNOWN') {
    return ACK_REPAIR_FROM_UNKNOWN.includes(next);
  }
  const from = STATUS_RANK[current] ?? -1;
  const to = STATUS_RANK[next] ?? -1;
  return to > from;
}

export function whatsAppStatusesStrictlyBelow(
  next: MessengerMessageStatus,
): MessengerMessageStatus[] {
  const to = STATUS_RANK[next] ?? -1;
  const below = RANKED_WHATSAPP_STATUSES.filter((status) => (STATUS_RANK[status] ?? -1) < to);
  if (ACK_REPAIR_FROM_UNKNOWN.includes(next)) {
    return [...below, 'OUTCOME_UNKNOWN'];
  }
  return below;
}

/** Owned provider-ref proof only. Generic outbound/failure CAS must not use this. */
export function whatsAppStatusesAllowedForOwnedProofWrite(
  next: MessengerMessageStatus,
): MessengerMessageStatus[] {
  if (next !== 'SENT' && next !== 'DELIVERED' && next !== 'READ') return [];
  const to = STATUS_RANK[next] ?? -1;
  const below = RANKED_WHATSAPP_STATUSES.filter((status) => (STATUS_RANK[status] ?? -1) < to);
  return [...new Set<MessengerMessageStatus>([...OWNED_PROOF_REPAIR_FROM, ...below])];
}

export function whatsAppStatusesAllowedForOutboundWrite(
  next: WhatsAppOutboundCasStatus,
): MessengerMessageStatus[] {
  switch (next) {
    case 'SENDING':
    case 'FAILED':
    case 'OUTCOME_UNKNOWN':
      return [...OUTBOUND_CAS_FROM];
    case 'SENT':
      return [...OUTBOUND_CAS_FROM, 'OUTCOME_UNKNOWN'];
  }
}

export const WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND';

export function isRetryableWhatsAppLifecycleSkip(skipReason: string | null): boolean {
  return skipReason === WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND;
}

export function isWhatsAppInboundEventType(value: string): value is WhatsAppInboundEventType {
  return (WHATSAPP_INBOUND_EVENT_TYPES as readonly string[]).includes(value);
}
