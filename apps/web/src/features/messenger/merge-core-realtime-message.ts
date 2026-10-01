import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { mergeMessengerDeliveryStatus } from './messenger-delivery-status';

/**
 * One cache row per server id and per idempotency key.
 * A canonical payload drops the client-only local send phase.
 */
export function mergeCoreRealtimeMessage(
  prev: MessengerCoreMessageRow[],
  message: MessengerCoreMessageRow,
): MessengerCoreMessageRow[] {
  if (message.deletedAt) return prev.filter((row) => row.id !== message.id);
  const serverIndex = indexById(prev, message.id);
  const keyIndex = indexByIdempotency(prev, message);
  if (serverIndex >= 0 && keyIndex >= 0) {
    return collapseDuplicate(prev, serverIndex, keyIndex, message);
  }
  if (keyIndex >= 0) return replaceMessageAt(prev, keyIndex, message);
  if (serverIndex < 0) return [...prev, message];
  return replaceMessageAt(prev, serverIndex, message);
}

function indexById(prev: MessengerCoreMessageRow[], id: string): number {
  return prev.findIndex((row) => row.id === id);
}

function indexByIdempotency(
  prev: MessengerCoreMessageRow[],
  message: MessengerCoreMessageRow,
): number {
  const key = message.idempotencyKey || message.localSend?.idempotencyKey;
  if (!key) return -1;
  return prev.findIndex((row) => row.id !== message.id && messageKey(row) === key);
}

function messageKey(row: MessengerCoreMessageRow): string | null {
  return row.idempotencyKey || row.localSend?.idempotencyKey || null;
}

function replaceMessageAt(
  prev: MessengerCoreMessageRow[],
  index: number,
  message: MessengerCoreMessageRow,
): MessengerCoreMessageRow[] {
  const current = prev[index];
  if (!current) return [...prev, message];
  const next = [...prev];
  next[index] = projectCanonical(current, message);
  return next;
}

function collapseDuplicate(
  prev: MessengerCoreMessageRow[],
  serverIndex: number,
  keyIndex: number,
  message: MessengerCoreMessageRow,
): MessengerCoreMessageRow[] {
  const current = prev[serverIndex];
  const merged = current ? projectCanonical(current, message) : message;
  return prev
    .map((row, index) => (index === serverIndex ? merged : row))
    .filter((_, index) => index !== keyIndex);
}

function projectCanonical(
  current: MessengerCoreMessageRow,
  message: MessengerCoreMessageRow,
): MessengerCoreMessageRow {
  const status = mergeMessengerDeliveryStatus(current.status, message.status);
  const merged: MessengerCoreMessageRow = { ...current, ...message, status };
  if (message.localSend) return { ...merged, localSend: message.localSend };
  delete merged.localSend;
  return merged;
}
