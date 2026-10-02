import type { MessengerMessageRow } from '@/lib/api/messenger';
import type { MessengerWsChannelPeerReadPayload, MessengerWsDmPeerReadPayload } from '@nbos/shared';

export type MessengerPresenceDelta = {
  employeeId: string;
  state: 'online' | 'offline';
};

export function parsePresenceSnapshot(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const raw = (payload as { employeeIds?: unknown }).employeeIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
}

export function parsePresenceDelta(payload: unknown): MessengerPresenceDelta | null {
  if (!payload || typeof payload !== 'object') return null;
  const employeeId = (payload as { employeeId?: unknown }).employeeId;
  const state = (payload as { state?: unknown }).state;
  if (typeof employeeId !== 'string' || employeeId.trim().length === 0) return null;
  if (state !== 'online' && state !== 'offline') return null;
  return { employeeId, state };
}

export function applyPresenceIds(
  current: readonly string[],
  employeeId: string,
  state: 'online' | 'offline',
): string[] {
  if (state === 'offline') return current.filter((id) => id !== employeeId);
  if (current.includes(employeeId)) return [...current];
  return [...current, employeeId];
}

export function parseChannelMessage(
  payload: unknown,
): { channelId: string; message: MessengerMessageRow } | null {
  if (!payload || typeof payload !== 'object') return null;
  const channelId = (payload as { channelId?: unknown }).channelId;
  const message = (payload as { message?: unknown }).message;
  if (typeof channelId !== 'string' || channelId.trim().length === 0) return null;
  if (!message || typeof message !== 'object') return null;
  return { channelId, message: message as MessengerMessageRow };
}

export function parseDmMessage(
  payload: unknown,
): { counterpartId: string; message: MessengerMessageRow } | null {
  if (!payload || typeof payload !== 'object') return null;
  const counterpartId = (payload as { counterpartId?: unknown }).counterpartId;
  const message = (payload as { message?: unknown }).message;
  if (typeof counterpartId !== 'string' || counterpartId.trim().length === 0) return null;
  if (!message || typeof message !== 'object') return null;
  return { counterpartId, message: message as MessengerMessageRow };
}

export function parseChannelTyping(
  payload: unknown,
): { channelId: string; employeeId: string; label: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const channelId = (payload as { channelId?: unknown }).channelId;
  const employeeId = (payload as { employeeId?: unknown }).employeeId;
  const label = (payload as { label?: unknown }).label;
  if (typeof channelId !== 'string' || typeof employeeId !== 'string') return null;
  if (typeof label !== 'string') return null;
  return { channelId, employeeId, label };
}

export function parseDmTyping(
  payload: unknown,
): { counterpartId: string; employeeId: string; label: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const counterpartId = (payload as { counterpartId?: unknown }).counterpartId;
  const employeeId = (payload as { employeeId?: unknown }).employeeId;
  const label = (payload as { label?: unknown }).label;
  if (typeof counterpartId !== 'string' || typeof employeeId !== 'string') return null;
  if (typeof label !== 'string') return null;
  return { counterpartId, employeeId, label };
}

export function parseDmPeerRead(payload: unknown): MessengerWsDmPeerReadPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const counterpartId = (payload as { counterpartId?: unknown }).counterpartId;
  const threadId = (payload as { threadId?: unknown }).threadId;
  const lastReadAt = (payload as { lastReadAt?: unknown }).lastReadAt;
  if (typeof counterpartId !== 'string' || counterpartId.trim().length === 0) return null;
  if (typeof threadId !== 'string' || threadId.trim().length === 0) return null;
  if (typeof lastReadAt !== 'string' || lastReadAt.trim().length === 0) return null;
  return { counterpartId, threadId, lastReadAt };
}

export function parseChannelPeerRead(payload: unknown): MessengerWsChannelPeerReadPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const channelId = (payload as { channelId?: unknown }).channelId;
  const readerId = (payload as { readerId?: unknown }).readerId;
  const lastReadAt = (payload as { lastReadAt?: unknown }).lastReadAt;
  if (typeof channelId !== 'string' || channelId.trim().length === 0) return null;
  if (typeof readerId !== 'string' || readerId.trim().length === 0) return null;
  if (typeof lastReadAt !== 'string' || lastReadAt.trim().length === 0) return null;
  return { channelId, readerId, lastReadAt };
}
