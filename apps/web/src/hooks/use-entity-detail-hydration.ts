'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface UseEntityDetailHydrationParams<T extends { id: string }> {
  entityId: string;
  open: boolean;
  initialEntity?: T | null;
  fetchById: (id: string) => Promise<T>;
  /** When true, fetched detail must not replace the in-memory entity. */
  isDirty?: () => boolean;
  loadErrorMessage?: string;
}

export interface UseEntityDetailHydrationResult<T extends { id: string }> {
  entity: T | null;
  setEntity: Dispatch<SetStateAction<T | null>>;
  /** True when there is no seed entity to render yet. */
  loading: boolean;
  /** True while a background refresh is in flight (seed already visible). */
  hydrating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Opens detail UIs instantly from a list-row seed, then hydrates via `fetchById` in the background.
 * Credentials vault uses the same staged pattern inline; prefer this hook for finance/CRM sheets.
 */
export function useEntityDetailHydration<T extends { id: string }>({
  entityId,
  open,
  initialEntity,
  fetchById,
  isDirty,
  loadErrorMessage = 'Could not load details.',
}: UseEntityDetailHydrationParams<T>): UseEntityDetailHydrationResult<T> {
  const [entity, setEntity] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByIdRef = useRef(fetchById);
  fetchByIdRef.current = fetchById;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const refresh = useCallback(async () => {
    if (!entityId) return;
    setHydrating(true);
    setError(null);
    try {
      const data = await fetchByIdRef.current(entityId);
      if (!isDirtyRef.current?.()) setEntity(data);
    } catch (caught) {
      setError(getApiErrorMessage(caught, loadErrorMessage));
    } finally {
      setHydrating(false);
    }
  }, [entityId, loadErrorMessage]);

  useEffect(() => {
    if (!open || !entityId) {
      setEntity(null);
      setLoading(false);
      setHydrating(false);
      setError(null);
      return;
    }

    const seed = initialEntity?.id === entityId ? initialEntity : null;
    if (seed) {
      setEntity(seed);
      setLoading(false);
      setError(null);
    } else {
      setEntity(null);
      setLoading(true);
      setError(null);
    }

    let cancelled = false;
    if (seed) setHydrating(true);

    void (async () => {
      try {
        const data = await fetchByIdRef.current(entityId);
        if (cancelled) return;
        if (!isDirtyRef.current?.()) setEntity(data);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        const message = getApiErrorMessage(caught, loadErrorMessage);
        if (!seed) {
          setEntity(null);
        }
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, entityId, initialEntity, loadErrorMessage]);

  return { entity, setEntity, loading, hydrating, error, refresh };
}
