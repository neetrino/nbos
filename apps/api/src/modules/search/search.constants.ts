import type { SearchQueryGroup } from './search.types';

export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_QUERY_LENGTH = 80;

export const SEARCH_LIMIT_ALL_GROUP = 5;
export const SEARCH_LIMIT_FOCUSED_GROUP = 15;

export const SEARCHER_TIMEOUT_MS = 2_500;

export const SEARCH_QUERY_GROUPS: readonly SearchQueryGroup[] = [
  'all',
  'leads',
  'deals',
  'products',
  'finance',
  'credentials',
] as const;
