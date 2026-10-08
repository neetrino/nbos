import { WHATSAPP_CORE_UNKNOWN_RECONCILE_MS } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';

const DELIVERED_STATUSES = new Set(['SENT', 'DELIVERED', 'READ']);

export type WhatsAppReconcileDeliveryDecision =
  | 'enqueue'
  | 'wait'
  | 'mark_unknown'
  | 'skip_delivered';

/**
 * A stale SENDING row is not proof the Gateway rejected the message.
 * Delivered rows are never enqueued again.
 */
export function decideWhatsAppReconcileDelivery(input: {
  messageStatus: string;
  commandStatus: string;
  firstAttemptAt: Date | null;
  now: Date;
  staleAfterMs?: number;
}): WhatsAppReconcileDeliveryDecision {
  if (DELIVERED_STATUSES.has(input.messageStatus)) return 'skip_delivered';
  if (input.messageStatus !== 'SENDING') return 'enqueue';
  if (input.commandStatus === 'OUTCOME_UNKNOWN') return 'enqueue';
  const staleAfterMs = input.staleAfterMs ?? WHATSAPP_CORE_UNKNOWN_RECONCILE_MS;
  if (!input.firstAttemptAt) return 'mark_unknown';
  const ageMs = input.now.getTime() - input.firstAttemptAt.getTime();
  if (ageMs < staleAfterMs) return 'wait';
  return 'mark_unknown';
}
