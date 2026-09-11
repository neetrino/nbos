import {
  clientDefaultSummaryKey,
  internalDefaultSummaryKey,
} from '../query/seed-messenger-bootstrap';
import { messengerQueryKeys } from '../query/messenger-query-keys';

export type PersistedMessengerQueryFamily =
  | 'internal-default'
  | 'client-default'
  | 'collections-internal'
  | 'collections-client';

/** Canonical persist families: default inboxes + collection lists only. */
export const CANONICAL_PERSISTED_QUERY_FAMILIES: readonly PersistedMessengerQueryFamily[] = [
  'internal-default',
  'client-default',
  'collections-internal',
  'collections-client',
];

export function isPersistedMessengerQueryKey(queryKey: readonly unknown[]): boolean {
  return persistedMessengerQueryFamily(queryKey) !== null;
}

export function persistedMessengerQueryFamily(
  queryKey: readonly unknown[],
): PersistedMessengerQueryFamily | null {
  if (queryKey[0] !== 'messenger') return null;
  if (keysEqual(queryKey, internalDefaultSummaryKey())) return 'internal-default';
  if (keysEqual(queryKey, clientDefaultSummaryKey())) return 'client-default';
  if (keysEqual(queryKey, messengerQueryKeys.collections('INTERNAL')))
    return 'collections-internal';
  if (keysEqual(queryKey, messengerQueryKeys.collections('CLIENT'))) return 'collections-client';
  return null;
}

function keysEqual(left: readonly unknown[], right: readonly unknown[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
