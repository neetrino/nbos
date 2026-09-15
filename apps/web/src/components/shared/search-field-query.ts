export const SEARCH_FIELD_TYPE_DEBOUNCE_MS = 150;
export const SEARCH_FIELD_SPINNER_DELAY_MS = 80;
export const SEARCH_FIELD_FOCUS_DELAY_MS = 50;

/** Debounce typing; empty query (open / clear) runs immediately. */
export function searchFieldTypeDelayMs(query: string): number {
  return query.trim().length === 0 ? 0 : SEARCH_FIELD_TYPE_DEBOUNCE_MS;
}
