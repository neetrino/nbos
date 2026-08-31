import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

export function mergeCoreRealtimeMessage(
  prev: MessengerCoreMessageRow[],
  message: MessengerCoreMessageRow,
): MessengerCoreMessageRow[] {
  const index = prev.findIndex((row) => row.id === message.id);
  if (index < 0) return [...prev, message];
  const next = [...prev];
  next[index] = { ...prev[index], ...message };
  return next;
}
