import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

const INTERNAL_SHEET_STATUS_LABEL: Record<
  NonNullable<MessengerCoreMessageRow['status']>,
  string
> = {
  QUEUED: 'Queued',
  SENDING: 'Sending',
  SENT: 'Delivered',
  DELIVERED: 'Delivered',
  READ: 'Read',
  FAILED: 'Failed',
  OUTCOME_UNKNOWN: 'Delivery unknown',
  CANCELLED: 'Cancelled',
};

/**
 * Receipt under an internal sheet message.
 * A stored internal send is Delivered: there is no separate carrier hop.
 */
export function internalSheetDeliveryLabel(
  status: MessengerCoreMessageRow['status'],
): string | null {
  if (!status) return null;
  return INTERNAL_SHEET_STATUS_LABEL[status];
}

/** True when another participant has already opened the chat past this message. */
export function internalSheetMessageSeen(
  status: MessengerCoreMessageRow['status'],
  createdAt: string,
  peerLastReadAt: string | null | undefined,
): boolean {
  if (status === 'READ') return true;
  if (!peerLastReadAt) return false;
  const readAt = Date.parse(peerLastReadAt);
  const sentAt = Date.parse(createdAt);
  if (Number.isNaN(readAt) || Number.isNaN(sentAt)) return false;
  return sentAt <= readAt;
}
