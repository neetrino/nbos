'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  collectCachedDirectUnreadByPeerId,
  collectCachedPinnedDirectPeerIds,
} from './find-cached-direct-conversation';

export type CachedDirectRailPeerState = {
  pinnedIds: ReadonlySet<string>;
  unreadByPeerId: ReadonlyMap<string, number>;
};

const EMPTY_STATE: CachedDirectRailPeerState = {
  pinnedIds: new Set(),
  unreadByPeerId: new Map(),
};

function railStateSignature(state: CachedDirectRailPeerState): string {
  const pinned = [...state.pinnedIds].sort().join(',');
  const unread = [...state.unreadByPeerId.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => `${id}:${count}`)
    .join(',');
  return `${pinned}|${unread}`;
}

/** Live pinned + unread DIRECT peer state from messenger inbox cache. */
export function useCachedDirectRailPeerState(): CachedDirectRailPeerState {
  const queryClient = useQueryClient();
  const snapshotRef = useRef<CachedDirectRailPeerState>(EMPTY_STATE);
  const signatureRef = useRef(railStateSignature(EMPTY_STATE));

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return queryClient.getQueryCache().subscribe((event) => {
        const key = event.query.queryKey;
        if (key[0] !== 'messenger' || key[1] !== 'internal') return;
        onStoreChange();
      });
    },
    [queryClient],
  );

  const getSnapshot = useCallback(() => {
    const next: CachedDirectRailPeerState = {
      pinnedIds: collectCachedPinnedDirectPeerIds(queryClient),
      unreadByPeerId: collectCachedDirectUnreadByPeerId(queryClient),
    };
    const signature = railStateSignature(next);
    if (signature !== signatureRef.current) {
      signatureRef.current = signature;
      snapshotRef.current = next;
    }
    return snapshotRef.current;
  }, [queryClient]);

  return useSyncExternalStore(subscribe, getSnapshot, () => snapshotRef.current);
}
