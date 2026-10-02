import { useEffect, useLayoutEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { openMessengerPersistChannel } from './messenger-persist-channel';
import { applyMessengerPersistSessionIdentity } from './messenger-persist-boundary';
import {
  hydrateMessengerPersistCache,
  importMessengerPersistOutbox,
  persistMessengerCacheNow,
} from './messenger-persist-controller';
import { isPersistedMessengerQueryKey } from './messenger-persist-allowlist';
import { isMessengerPersistenceEnabled } from './messenger-persist.constants';
import {
  registerMessengerOutboxPersistScheduler,
  shouldAdoptRemoteMessengerOutbox,
} from './messenger-outbox-store';
import {
  isMessengerPersistHydrating,
  registerMessengerPersistHost,
} from './messenger-persist-ready';
import {
  bindMessengerPersistQueryClient,
  cancelMessengerPersistHost,
  isMessengerPersistIdentity,
  readMessengerPersistGeneration,
} from './messenger-persist-session';

export function useMessengerPersistence(
  queryClient: QueryClient,
  liveIdentity: string | null,
  status: 'loading' | 'authenticated' | 'unauthenticated',
): void {
  useLayoutEffect(() => {
    bindMessengerPersistQueryClient(queryClient);
    registerMessengerPersistHost();
    return () => {
      cancelMessengerPersistHost();
      bindMessengerPersistQueryClient(null);
    };
  }, [queryClient]);

  useLayoutEffect(() => {
    if (status === 'loading') return;
    applyMessengerPersistSessionIdentity(queryClient, liveIdentity);
  }, [queryClient, liveIdentity, status]);

  useEffect(() => {
    if (!liveIdentity || !isMessengerPersistIdentity(liveIdentity)) return undefined;
    return startMessengerPersistSession(queryClient, liveIdentity);
  }, [queryClient, liveIdentity]);
}

function startMessengerPersistSession(queryClient: QueryClient, identityId: string): () => void {
  let cancelled = false;
  let writing = false;
  let queued = false;
  const peer = openPersistPeer(queryClient, identityId);
  void hydrateMessengerPersistCache(queryClient, identityId);
  const flush = () => {
    if (cancelled || writing) return;
    writing = true;
    void flushQueuedWrites(
      queryClient,
      identityId,
      () => queued,
      (value) => {
        queued = value;
      },
      peer.announce,
    ).finally(() => {
      writing = false;
      if (!cancelled && queued) flush();
    });
  };
  const schedule = () => {
    if (cancelled || isMessengerPersistHydrating()) return;
    queued = true;
    flush();
  };
  registerMessengerOutboxPersistScheduler(schedule);
  const unsubscribe = subscribeAllowlistedSuccess(queryClient, schedule);
  const stopLifecycle = listenPersistLifecycle(schedule);
  return () => {
    cancelled = true;
    queued = false;
    registerMessengerOutboxPersistScheduler(null);
    unsubscribe();
    stopLifecycle();
    peer.close();
  };
}

function openPersistPeer(queryClient: QueryClient, identityId: string) {
  const channel = openMessengerPersistChannel(identityId, (message) => {
    if (!shouldAdoptRemoteMessengerOutbox(message.capturedAt)) return;
    void importMessengerPersistOutbox(queryClient, identityId);
  });
  return {
    announce: channel
      ? (envelope: Parameters<NonNullable<typeof channel.post>>[0]) => channel.post(envelope)
      : null,
    close: () => channel?.close(),
  };
}

async function flushQueuedWrites(
  queryClient: QueryClient,
  identityId: string,
  readQueued: () => boolean,
  setQueued: (value: boolean) => void,
  announce: Parameters<typeof persistMessengerCacheNow>[3],
): Promise<void> {
  while (readQueued()) {
    setQueued(false);
    if (isMessengerPersistHydrating()) return;
    await persistMessengerCacheNow(
      queryClient,
      identityId,
      readMessengerPersistGeneration(),
      announce,
    );
  }
}

function subscribeAllowlistedSuccess(queryClient: QueryClient, schedule: () => void): () => void {
  if (!isMessengerPersistenceEnabled()) return () => undefined;
  return queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated') return;
    const state = event.query.state;
    if (state.status !== 'success' || state.fetchStatus !== 'idle' || state.error) return;
    if (!isPersistedMessengerQueryKey(event.query.queryKey)) return;
    schedule();
  });
}

function listenPersistLifecycle(schedule: () => void): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => undefined;
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') schedule();
  };
  const onPageHide = () => schedule();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
  };
}
