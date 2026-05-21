'use client';

import { useCallback, useState } from 'react';

const STORAGE_PREFIX = 'nbos:deal-sheet-collapse:';

export const DEAL_SHEET_COLLAPSE_KEY = {
  DEAL_PROJECT: 'deal-project',
  OFFER: 'offer',
  CONTRACT: 'contract',
} as const;

export type DealSheetCollapseKey =
  (typeof DEAL_SHEET_COLLAPSE_KEY)[keyof typeof DEAL_SHEET_COLLAPSE_KEY];

function readStoredOpen(storageKey: string, defaultOpen: boolean): boolean {
  if (typeof window === 'undefined') return defaultOpen;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch {
    /* ignore quota / private mode */
  }
  return defaultOpen;
}

function writeStoredOpen(storageKey: string, open: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Persists deal sheet section open/closed state in localStorage (default: open). */
export function useDealSheetSectionCollapse(storageKey: DealSheetCollapseKey, defaultOpen = true) {
  const [open, setOpen] = useState(() => readStoredOpen(storageKey, defaultOpen));

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      writeStoredOpen(storageKey, next);
    },
    [storageKey],
  );

  return { open, onOpenChange };
}
