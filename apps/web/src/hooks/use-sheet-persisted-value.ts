'use client';

import { useCallback, useState } from 'react';

/**
 * Retains the last truthy value while a sheet exit animation runs.
 * Pair with `Sheet` `onOpenChangeComplete` and `useSheetHostMounted`.
 */
export function useSheetPersistedValue<T>(value: T | null | undefined): {
  persistedValue: T | null;
  onOpenChangeComplete: (open: boolean) => void;
} {
  const [persisted, setPersisted] = useState<T | null>(null);

  // Keep the latest truthy value while the sheet is open / exiting (React render-time adjust).
  if (value != null && !Object.is(value, persisted)) {
    setPersisted(value);
  }

  const onOpenChangeComplete = useCallback((nextOpen: boolean) => {
    if (!nextOpen) setPersisted(null);
  }, []);

  return {
    persistedValue: value ?? persisted,
    onOpenChangeComplete,
  };
}

/** Keep sheet host mounted while open or the close animation is still running. */
export function useSheetHostMounted(open: boolean, persistedValue: unknown): boolean {
  return open || persistedValue != null;
}
