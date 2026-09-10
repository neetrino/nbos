import { useEffect, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerZone } from './messenger-query-keys';
import {
  acknowledgeMessengerBootstrapLatch,
  clearBootstrapFailure,
  latchedBootstrapFailure,
  messengerDefaultCacheUpdatedAfter,
  readMessengerBootstrapState,
  recordBootstrapFailure,
} from './messenger-bootstrap-state';
import {
  isMessengerDefaultCacheFresh,
  remainingMessengerDefaultFreshMs,
  seedClientMessengerBootstrap,
  seedInternalMessengerBootstrap,
} from './seed-messenger-bootstrap';
import { useMessengerPersistQueriesEnabled } from '../persist/use-messenger-persist-queries-enabled';

export {
  messengerCollectionsEnabled,
  messengerDefaultQueriesEnabled,
  readMessengerBootstrapState,
  shouldRetryMessengerBootstrap,
} from './messenger-bootstrap-state';

const inflight = new WeakMap<QueryClient, Partial<Record<MessengerZone, Promise<void>>>>();

export function useMessengerZoneBootstrap(zone: MessengerZone, enabled: boolean) {
  const queryClient = useQueryClient();
  const persistReady = useMessengerPersistQueriesEnabled();
  const canRun = enabled && persistReady;
  const [, setGeneration] = useState(0);
  const state = readMessengerBootstrapState(queryClient, zone, canRun);

  useEffect(() => {
    if (!canRun) return;
    acknowledgeMessengerBootstrapLatch(queryClient, zone);
    if (isMessengerDefaultCacheFresh(queryClient, zone)) {
      const timer = setTimeout(
        () => setGeneration((current) => current + 1),
        remainingMessengerDefaultFreshMs(queryClient, zone),
      );
      return () => clearTimeout(timer);
    }
    const failure = latchedBootstrapFailure(queryClient, zone);
    if (failure && !messengerDefaultCacheUpdatedAfter(queryClient, zone, failure.failedAt)) {
      return;
    }
    let cancelled = false;
    void ensureMessengerBootstrap(queryClient, zone)
      .finally(() => {
        if (!cancelled) setGeneration((current) => current + 1);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [canRun, queryClient, zone, state.fresh, state.error, state.settled]);

  return { error: state.error, settled: state.settled, isPending: state.isPending };
}

export function ensureMessengerBootstrap(
  queryClient: QueryClient,
  zone: MessengerZone,
): Promise<void> {
  const current = inflight.get(queryClient) ?? {};
  const existing = current[zone];
  if (existing) return existing;
  const next = runMessengerBootstrap(queryClient, zone).finally(() => {
    const map = inflight.get(queryClient);
    if (!map) return;
    delete map[zone];
  });
  inflight.set(queryClient, { ...current, [zone]: next });
  return next;
}

export async function runMessengerBootstrap(
  queryClient: QueryClient,
  zone: MessengerZone,
): Promise<void> {
  clearBootstrapFailure(queryClient, zone);
  try {
    if (zone === 'CLIENT') {
      seedClientMessengerBootstrap(queryClient, await messengerClientApi.bootstrap());
      return;
    }
    seedInternalMessengerBootstrap(queryClient, await messengerCoreApi.bootstrap());
  } catch (cause) {
    recordBootstrapFailure(queryClient, zone, cause);
    throw cause;
  }
}
