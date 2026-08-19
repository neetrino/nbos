import type { SearchQueryGroup } from '@/lib/api/search';

export const GLOBAL_SEARCH_MIN_QUERY_LENGTH = 2;

export const GLOBAL_SEARCH_QUERY_GROUP_ALL: SearchQueryGroup = 'all';

export const GLOBAL_SEARCH_HINT =
  'Search leads, deals, products, finance records, and credentials you can access.';

export const GLOBAL_SEARCH_SHORT_QUERY_HINT = 'Type at least 2 characters to search.';

export function isGlobalSearchShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  return key === 'k' && (event.metaKey || event.ctrlKey);
}

export function formatGlobalSearchShortcutLabel(): string {
  if (typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)) {
    return '⌘K';
  }
  return 'Ctrl+K';
}
