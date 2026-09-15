'use client';

import { useCallback, useState } from 'react';

export interface RevalidationState {
  /** True for the first load only, while there is no renderable data yet. */
  loading: boolean;
  /** True while a fetch runs over data that is already on screen. */
  refreshing: boolean;
  /**
   * Marks a fetch as started. Pass whether the surface currently holds renderable
   * data — read it from a ref, not from render state, so concurrent reloads agree.
   */
  begin: (hasData: boolean) => void;
  /** Marks the in-flight fetch as finished, whichever phase it was in. */
  end: () => void;
}

/**
 * Two-boolean load state for hand-rolled data hooks, replacing the single `loading`
 * flag that makes every refetch look like a first load.
 *
 * A surface that already holds data must never fall back to `loading`, because callers
 * render a skeleton in its place and the content behind an open sheet visibly re-mounts.
 * `begin(true)` reports `refreshing` instead and leaves `loading` false, so the content
 * stays on screen while it is revalidated.
 *
 * Pair with `DataView` on the render side. See `docs/architecture/data-loading-and-refresh.md`.
 */
export function useRevalidationState(initialLoading = true): RevalidationState {
  const [loading, setLoading] = useState(initialLoading);
  const [refreshing, setRefreshing] = useState(false);

  const begin = useCallback((hasData: boolean) => {
    if (hasData) setRefreshing(true);
    else setLoading(true);
  }, []);

  const end = useCallback(() => {
    setLoading(false);
    setRefreshing(false);
  }, []);

  return { loading, refreshing, begin, end };
}
