import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

const OUTBOUND_DELIVERY_LABEL: Record<NonNullable<MessengerCoreMessageRow['status']>, string> = {
  QUEUED: 'Queued',
  SENDING: 'Sending',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  READ: 'Read',
  FAILED: 'Failed',
  OUTCOME_UNKNOWN: 'Delivery unknown',
  CANCELLED: 'Cancelled',
};

export function clientOutboundDeliveryLabel(row: MessengerCoreMessageRow): string | null {
  if (row.direction !== 'OUTBOUND' || !row.status) return null;
  return OUTBOUND_DELIVERY_LABEL[row.status] ?? null;
}
