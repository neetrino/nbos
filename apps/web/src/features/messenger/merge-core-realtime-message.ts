import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { mergeMessengerDeliveryStatus } from './messenger-delivery-status';

export function mergeCoreRealtimeMessage(
  prev: MessengerCoreMessageRow[],
  message: MessengerCoreMessageRow,
): MessengerCoreMessageRow[] {
  const index = prev.findIndex((row) => row.id === message.id);
  if (index < 0) return [...prev, message];
  const current = prev[index];
  if (!current) return [...prev, message];
  const next = [...prev];
  next[index] = {
    ...current,
    ...message,
    status: mergeMessengerDeliveryStatus(current.status, message.status),
  };
  return next;
}
