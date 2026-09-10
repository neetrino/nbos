import { MESSENGER_WS_READ_UPDATED_SCOPE } from '@nbos/shared';

export function isMessengerListReadPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  return (payload as { scope?: unknown }).scope === MESSENGER_WS_READ_UPDATED_SCOPE.LISTS;
}
