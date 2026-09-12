import type { SearchQueryGroup } from '@/lib/api/search';

const SEARCH_GROUP_IDS = ['all', 'leads', 'deals', 'products', 'finance', 'credentials'] as const;

export function isSearchQueryGroup(value: string): value is SearchQueryGroup {
  return SEARCH_GROUP_IDS.some((id) => id === value);
}

/** Translate a search tab by stable group id. Unknown ids keep the API label. */
export function localizeSearchGroupLabel(
  id: string,
  fallback: string,
  t: (key: `groups.${SearchQueryGroup}`) => string,
): string {
  if (!isSearchQueryGroup(id)) return fallback;
  return t(`groups.${id}`);
}
