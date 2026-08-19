export type SearchFilterRecord = Record<string, string>;

export const EMPTY_SEARCH_FILTERS: SearchFilterRecord = {};

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Keeps only string entries. Empty object is a valid cleared state. */
export function parseSearchFilterRecord(raw: unknown): SearchFilterRecord {
  if (!isPlainRecord(raw)) {
    return EMPTY_SEARCH_FILTERS;
  }
  const next: SearchFilterRecord = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.length > 0 && typeof value === 'string') {
      next[key] = value;
    }
  }
  return Object.keys(next).length === 0 ? EMPTY_SEARCH_FILTERS : next;
}
