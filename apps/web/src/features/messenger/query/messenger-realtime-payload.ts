import {
  MESSENGER_WS_READ_UPDATED_SCOPE,
  MESSENGER_WS_ZONE,
  type MessengerWsConversationAccessChangedPayload,
  type MessengerWsConversationReadUpdatedPayload,
  type MessengerWsConversationSummaryPayload,
  type MessengerWsZone,
} from '@nbos/shared';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

export function isMessengerWsZone(value: unknown): value is MessengerWsZone {
  return value === MESSENGER_WS_ZONE.INTERNAL || value === MESSENGER_WS_ZONE.CLIENT;
}

export function isConversationSummaryPayload(
  payload: unknown,
): payload is MessengerWsConversationSummaryPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return (
    isNonEmptyString(row.conversationId) &&
    isMessengerWsZone(row.zone) &&
    isIsoTimestamp(row.lastMessageAt) &&
    isPreview(row.lastMessagePreview) &&
    isAbsoluteUnread(row.unreadCount) &&
    isNullableIsoTimestamp(row.lastReadAt)
  );
}

export function isConversationReadPayload(
  payload: unknown,
): payload is MessengerWsConversationReadUpdatedPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return (
    row.scope === MESSENGER_WS_READ_UPDATED_SCOPE.CONVERSATION &&
    isNonEmptyString(row.conversationId) &&
    isMessengerWsZone(row.zone) &&
    isAbsoluteUnread(row.unreadCount) &&
    isIsoTimestamp(row.lastReadAt)
  );
}

export function isConversationAccessChangedPayload(
  payload: unknown,
): payload is MessengerWsConversationAccessChangedPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return isNonEmptyString(row.conversationId) && isMessengerWsZone(row.zone);
}

export function isCoreConversationMessagePayload(
  payload: unknown,
): payload is { conversationId: string; message: MessengerCoreMessageRow } {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  if (!isNonEmptyString(row.conversationId) || !row.message || typeof row.message !== 'object') {
    return false;
  }
  const message = row.message as Record<string, unknown>;
  return isNonEmptyString(message.id) && message.conversationId === row.conversationId;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPreview(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isAbsoluteUnread(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isNullableIsoTimestamp(value: unknown): value is string | null {
  return value === null || isIsoTimestamp(value);
}
