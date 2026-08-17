'use client';

import { useEffect, type MutableRefObject, type RefObject } from 'react';
import { EMPLOYEE_PICKER_PAGE_SIZE } from '@/lib/employees/employee-directory-constants';
import type { RelationEntityKind } from './relation-picker.types';

const DEFAULT_MAX_RESULTS = 8;
const SEARCH_DEBOUNCE_MS = 150;

export function resolveRelationPickerMaxResults(
  entityKind: RelationEntityKind,
  maxResults?: number,
): number {
  if (maxResults != null) return maxResults;
  return entityKind === 'employee' ? EMPLOYEE_PICKER_PAGE_SIZE : DEFAULT_MAX_RESULTS;
}

export function resolveRelationPickerSearchDebounceMs(entityKind: RelationEntityKind): number {
  return entityKind === 'employee' ? 0 : SEARCH_DEBOUNCE_MS;
}

export function useRelationPickerOpenEffects({
  open,
  disabled,
  doSearch,
  containerRef,
  inputRef,
  debounceRef,
  setOpen,
  setQuery,
}: {
  open: boolean;
  disabled: boolean;
  doSearch: (q: string) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  debounceRef: MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
}): void {
  useEffect(() => {
    if (open && !disabled) {
      doSearch('');
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    const pendingSearch = debounceRef.current;
    return () => {
      if (pendingSearch) clearTimeout(pendingSearch);
    };
  }, [open, disabled, doSearch, debounceRef, inputRef]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled, setOpen]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, containerRef, setOpen, setQuery]);
}
