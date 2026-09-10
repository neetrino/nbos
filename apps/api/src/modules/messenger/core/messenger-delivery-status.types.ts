export type MessengerDeliveryStatusEvent = {
  conversationId: string;
  messageId: string;
  status: string;
  occurredAt: string;
};

export type MessengerDeliveryStatusPublisher = {
  publish(event: MessengerDeliveryStatusEvent): Promise<void>;
};

export const MESSENGER_DELIVERY_STATUS_CHANNEL = 'nbos:messenger:delivery-status';

const DELIVERY_STATUSES = [
  'QUEUED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'OUTCOME_UNKNOWN',
  'CANCELLED',
] as const;

export function isMessengerDeliveryStatusEvent(
  value: unknown,
): value is MessengerDeliveryStatusEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (typeof row.conversationId !== 'string' || row.conversationId.trim() === '') return false;
  if (typeof row.messageId !== 'string' || row.messageId.trim() === '') return false;
  if (typeof row.status !== 'string' || !DELIVERY_STATUSES.includes(row.status as never)) {
    return false;
  }
  if (typeof row.occurredAt !== 'string' || Number.isNaN(Date.parse(row.occurredAt))) return false;
  return true;
}
