import type { QueryClient } from '@tanstack/react-query';
import type { MessengerZone } from './messenger-query-keys';
import {
  isMessengerDefaultCacheFresh,
  messengerDefaultCacheKeys,
} from './seed-messenger-bootstrap';

export type MessengerBootstrapView = {
  fresh: boolean;
  error: Error | null;
  settled: boolean;
  isPending: boolean;
};

type BootstrapFailure = {
  error: Error;
  failedAt: number;
};

const bootstrapFailures = new WeakMap<QueryClient, Partial<Record<MessengerZone, BootstrapFailure>>>();

export function readMessengerBootstrapState(
  queryClient: QueryClient,
  zone: MessengerZone,
  enabled: boolean,
): MessengerBootstrapView {
  const fresh = enabled && isMessengerDefaultCacheFresh(queryClient, zone);
  const failure = latchedBootstrapFailure(queryClient, zone);
  const recovered = failure
    ? messengerDefaultCacheUpdatedAfter(queryClient, zone, failure.failedAt)
    : false;
  const error = failure && !recovered ? failure.error : null;
  return {
    fresh,
    error,
    settled: !enabled || fresh || error !== null,
    isPending: enabled && !fresh && error === null,
  };
}

export function messengerCollectionsEnabled(
  enabled: boolean,
  bootstrap: Pick<MessengerBootstrapView, 'settled'>,
): boolean {
  return enabled && bootstrap.settled;
}

export function messengerDefaultQueriesEnabled(
  enabled: boolean,
  bootstrap: Pick<MessengerBootstrapView, 'settled'>,
  isDefaultDataset: boolean,
): boolean {
  return enabled && (!isDefaultDataset || bootstrap.settled);
}

export function shouldRetryMessengerBootstrap(
  queryClient: QueryClient,
  zone: MessengerZone,
): boolean {
  const failure = latchedBootstrapFailure(queryClient, zone);
  if (failure && !messengerDefaultCacheUpdatedAfter(queryClient, zone, failure.failedAt)) {
    return false;
  }
  return !isMessengerDefaultCacheFresh(queryClient, zone);
}

export function acknowledgeMessengerBootstrapLatch(
  queryClient: QueryClient,
  zone: MessengerZone,
): void {
  const failure = latchedBootstrapFailure(queryClient, zone);
  const recovered = failure
    ? messengerDefaultCacheUpdatedAfter(queryClient, zone, failure.failedAt)
    : false;
  if (isMessengerDefaultCacheFresh(queryClient, zone) || recovered) {
    clearBootstrapFailure(queryClient, zone);
  }
}

export function recordBootstrapFailure(
  queryClient: QueryClient,
  zone: MessengerZone,
  cause: unknown,
): void {
  const current = bootstrapFailures.get(queryClient) ?? {};
  current[zone] = {
    error: cause instanceof Error ? cause : new Error('Messenger bootstrap failed'),
    failedAt: Date.now(),
  };
  bootstrapFailures.set(queryClient, current);
}

export function clearBootstrapFailure(queryClient: QueryClient, zone: MessengerZone): void {
  const current = bootstrapFailures.get(queryClient);
  if (!current || !current[zone]) return;
  delete current[zone];
}

export function latchedBootstrapFailure(
  queryClient: QueryClient,
  zone: MessengerZone,
): BootstrapFailure | null {
  return bootstrapFailures.get(queryClient)?.[zone] ?? null;
}

export function messengerDefaultCacheUpdatedAfter(
  queryClient: QueryClient,
  zone: MessengerZone,
  failedAt: number,
): boolean {
  return messengerDefaultCacheKeys(zone).every((queryKey) => {
    const state = queryClient.getQueryState(queryKey);
    return state?.data !== undefined && state.dataUpdatedAt >= failedAt;
  });
}
