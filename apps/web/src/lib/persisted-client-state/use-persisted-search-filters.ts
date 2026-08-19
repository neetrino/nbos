'use client';

import { useCallback, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react';
import { getPersistedReplaceStore } from './create-persisted-replace-store';
import {
  EMPTY_SEARCH_FILTERS,
  parseSearchFilterRecord,
  type SearchFilterRecord,
} from './parse-search-filter-record';

const STORAGE_PREFIX = 'nbos:search-filters:';

function parseStoredRecord(
  raw: string | null,
  defaultValue: SearchFilterRecord,
): SearchFilterRecord {
  if (raw == null) {
    return defaultValue;
  }
  try {
    return parseSearchFilterRecord(JSON.parse(raw) as unknown);
  } catch {
    return defaultValue;
  }
}

function getSearchFilterStore(pageId: string, defaultValue: SearchFilterRecord) {
  return getPersistedReplaceStore<SearchFilterRecord>(
    `${STORAGE_PREFIX}${pageId}`,
    defaultValue,
    (raw) => parseStoredRecord(raw, defaultValue),
  );
}

/**
 * Persists IntegratedSearchFilters values per screen (not the search query).
 * Setter matches `useState` — `setFilters({})` replaces the whole record.
 */
export function usePersistedSearchFilters(
  pageId: string,
  defaultValue: SearchFilterRecord = EMPTY_SEARCH_FILTERS,
): [SearchFilterRecord, Dispatch<SetStateAction<SearchFilterRecord>>] {
  const store = getSearchFilterStore(pageId, defaultValue);
  const value = useSyncExternalStore(store.subscribe, store.read, () => defaultValue);

  const setValue = useCallback<Dispatch<SetStateAction<SearchFilterRecord>>>(
    (update) => {
      const current = store.read();
      const next = typeof update === 'function' ? update(current) : update;
      store.replace(next);
    },
    [store],
  );

  return [value, setValue];
}

export function usePersistedSearchFilterField(
  pageId: string,
  field: string,
  defaultValue: string,
): [string, (value: string) => void] {
  const [values, setValues] = usePersistedSearchFilters(pageId, { [field]: defaultValue });
  const setField = useCallback(
    (next: string) => {
      setValues({ [field]: next });
    },
    [field, setValues],
  );
  return [values[field] ?? defaultValue, setField];
}

export function readPersistedSearchFilters(
  pageId: string,
  defaultValue: SearchFilterRecord = EMPTY_SEARCH_FILTERS,
): SearchFilterRecord {
  return getSearchFilterStore(pageId, defaultValue).read();
}

export function writePersistedSearchFilters(pageId: string, value: SearchFilterRecord): void {
  getSearchFilterStore(pageId, EMPTY_SEARCH_FILTERS).replace(value);
}
