import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

const STATUS_RANK: Record<string, number> = {
  QUEUED: 0,
  SENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4,
};

const TERMINAL = new Set(['FAILED', 'CANCELLED']);
const ACK_FROM_UNKNOWN = new Set(['SENT', 'DELIVERED', 'READ']);

export function canAdvanceMessengerDeliveryStatus(
  current: MessengerCoreMessageRow['status'] | undefined,
  next: MessengerCoreMessageRow['status'] | undefined,
): boolean {
  if (!next || next === current) return false;
  if (!current) return true;
  if (TERMINAL.has(current)) return false;
  if (current === 'OUTCOME_UNKNOWN') return ACK_FROM_UNKNOWN.has(next);
  const from = STATUS_RANK[current] ?? -1;
  const to = STATUS_RANK[next] ?? -1;
  return to > from;
}

export function mergeMessengerDeliveryStatus(
  current: MessengerCoreMessageRow['status'] | undefined,
  next: MessengerCoreMessageRow['status'] | undefined,
): MessengerCoreMessageRow['status'] | undefined {
  if (!next) return current;
  if (!current) return next;
  if (next === current) return current;
  return canAdvanceMessengerDeliveryStatus(current, next) ? next : current;
}
