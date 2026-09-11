import type { QueryClient } from '@tanstack/react-query';
import type {
  MessengerCoreCollectionRow,
  MessengerCoreConversationRow,
} from '@/lib/api/messenger-core';
import type { MessengerClientConversationRow } from '@/lib/api/messenger-core-client';
import { messengerQueryKeys, type MessengerZone } from './messenger-query-keys';
import { MESSENGER_QUERY_STALE_TIME_MS } from './messenger-query-policy';
import {
  clearMessengerHttpCheckpoint,
  parseMessengerHttpCheckpoint,
  writeMessengerHttpCheckpoint,
} from './messenger-checkpoint-store';

export type MessengerBootstrapRecoveryFields = {
  recoveryMode?: 'FULL' | 'DELTA' | null;
  checkpoint?: string | null;
  authorizationEpoch?: string | null;
};

export type InternalMessengerBootstrapPayload = {
  summaries: { items: MessengerCoreConversationRow[]; mentionsAvailable: boolean };
  collections: MessengerCoreCollectionRow[];
} & MessengerBootstrapRecoveryFields;

export type ClientMessengerBootstrapPayload = {
  summaries: { items: MessengerClientConversationRow[] };
  collections: MessengerCoreCollectionRow[];
} & MessengerBootstrapRecoveryFields;

export function internalDefaultSummaryKey() {
  return messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
}

export function clientDefaultSummaryKey() {
  return messengerQueryKeys.clientSummaries({
    section: 'inbox',
    q: '',
    filter: 'all',
    provider: '',
  });
}

export function seedInternalMessengerBootstrap(
  queryClient: QueryClient,
  payload: InternalMessengerBootstrapPayload,
): void {
  seedZoneBootstrap(queryClient, 'INTERNAL', payload, () => {
    queryClient.setQueryData(internalDefaultSummaryKey(), payload.summaries);
    queryClient.setQueryData(messengerQueryKeys.collections('INTERNAL'), payload.collections);
  });
}

export function seedClientMessengerBootstrap(
  queryClient: QueryClient,
  payload: ClientMessengerBootstrapPayload,
): void {
  seedZoneBootstrap(queryClient, 'CLIENT', payload, () => {
    queryClient.setQueryData(clientDefaultSummaryKey(), payload.summaries);
    queryClient.setQueryData(messengerQueryKeys.collections('CLIENT'), payload.collections);
  });
}

export function isMessengerDefaultCacheFresh(
  queryClient: QueryClient,
  zone: MessengerZone,
): boolean {
  return remainingMessengerDefaultFreshMs(queryClient, zone) > 0;
}

export function remainingMessengerDefaultFreshMs(
  queryClient: QueryClient,
  zone: MessengerZone,
): number {
  const remaining = messengerDefaultCacheKeys(zone).map((queryKey) =>
    queryFreshRemainingMs(queryClient, queryKey),
  );
  return Math.min(...remaining);
}

export function messengerDefaultCacheKeys(zone: MessengerZone): Array<readonly unknown[]> {
  const summaryKey = zone === 'CLIENT' ? clientDefaultSummaryKey() : internalDefaultSummaryKey();
  return [summaryKey, messengerQueryKeys.collections(zone)];
}

export function hasMessengerDefaultCacheData(
  queryClient: QueryClient,
  zone: MessengerZone,
): boolean {
  return messengerDefaultCacheKeys(zone).every(
    (queryKey) => queryClient.getQueryData(queryKey) !== undefined,
  );
}

function seedZoneBootstrap(
  queryClient: QueryClient,
  zone: MessengerZone,
  payload: MessengerBootstrapRecoveryFields,
  writeCanonical: () => void,
): void {
  const token = parseMessengerHttpCheckpoint(payload);
  if (payload.recoveryMode === 'DELTA' && !token) {
    throw new Error('Messenger bootstrap checkpoint missing');
  }
  writeCanonical();
  if (payload.recoveryMode === 'DELTA' && token) {
    writeMessengerHttpCheckpoint(queryClient, zone, token);
    return;
  }
  clearMessengerHttpCheckpoint(queryClient, zone);
}

function queryFreshRemainingMs(queryClient: QueryClient, queryKey: readonly unknown[]): number {
  const state = queryClient.getQueryState(queryKey);
  if (!state?.dataUpdatedAt || state.data === undefined || state.isInvalidated) return 0;
  return Math.max(0, MESSENGER_QUERY_STALE_TIME_MS - (Date.now() - state.dataUpdatedAt));
}
