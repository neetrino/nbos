'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { collectCachedPinnedDirectPeerIds } from './find-cached-direct-conversation';

function pinnedIdsSignature(ids: ReadonlySet<string>): string {
  return [...ids].sort().join(',');
}

/** Live set of pinned DIRECT peers from messenger inbox cache. */
export function useCachedPinnedDirectPeerIds(): ReadonlySet<string> {
  const queryClient = useQueryClient();
  const snapshotRef = useRef<ReadonlySet<string>>(new Set());
  const signatureRef = useRef('');

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
    const next = collectCachedPinnedDirectPeerIds(queryClient);
    const signature = pinnedIdsSignature(next);
    if (signature !== signatureRef.current) {
      signatureRef.current = signature;
      snapshotRef.current = next;
    }
    return snapshotRef.current;
  }, [queryClient]);

  return useSyncExternalStore(subscribe, getSnapshot, () => snapshotRef.current);
}
