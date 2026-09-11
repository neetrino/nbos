import type { MessengerWsConversationSummaryPayload } from '@nbos/shared';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { compareIsoInstants } from './messenger-realtime-watermarks';

/**
 * In-session summary reduction only. Phase 4 owns durable revisions and delta replay.
 */
export function reduceConversationSummary(
  row: MessengerCoreConversationRow,
  payload: MessengerWsConversationSummaryPayload,
  watermark: string | null,
): MessengerCoreConversationRow {
  const cachedAt = row.lastMessageAt;
  if (cachedAt && compareIsoInstants(payload.lastMessageAt, cachedAt) < 0) {
    return row;
  }
  const unreadCount = resolveSummaryUnread(payload.lastMessageAt, payload.unreadCount, watermark);
  if (cachedAt && compareIsoInstants(payload.lastMessageAt, cachedAt) === 0) {
    return row.unreadCount === unreadCount ? row : { ...row, unreadCount };
  }
  return {
    ...row,
    lastMessageAt: payload.lastMessageAt,
    lastMessagePreview: payload.lastMessagePreview,
    unreadCount,
  };
}

export function resolveSummaryUnread(
  lastMessageAt: string,
  unreadCount: number,
  watermark: string | null,
): number {
  if (watermark && compareIsoInstants(lastMessageAt, watermark) <= 0) return 0;
  return unreadCount;
}
