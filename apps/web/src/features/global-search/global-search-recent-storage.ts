'use client';

import type { SearchEntityType, SearchGroupId, SearchHit } from '@/lib/api/search';
import { createPersistedJsonStore } from '@/lib/persisted-client-state';

export const GLOBAL_SEARCH_RECENT_STORAGE_KEY = 'nbos.globalSearch.recentHits';
export const GLOBAL_SEARCH_RECENT_LIMIT = 8;
export const GLOBAL_SEARCH_RECENT_HEADING = 'Recent';

type GlobalSearchRecentState = {
  items: SearchHit[];
};

const SEARCH_ENTITY_TYPES = new Set<SearchEntityType>([
  'lead',
  'deal',
  'product',
  'invoice',
  'payment',
  'order',
  'subscription',
  'expense',
  'credential',
]);

const SEARCH_GROUP_IDS = new Set<SearchGroupId>([
  'leads',
  'deals',
  'products',
  'finance',
  'credentials',
]);

const DEFAULT_RECENT_STATE: GlobalSearchRecentState = { items: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function recentSearchHitKey(hit: Pick<SearchHit, 'entityType' | 'id'>): string {
  return `${hit.entityType}:${hit.id}`;
}

function parseSearchHit(value: unknown): SearchHit | null {
  if (!isRecord(value)) return null;
  const entityType = value.entityType;
  const group = value.group;
  if (typeof entityType !== 'string' || !SEARCH_ENTITY_TYPES.has(entityType as SearchEntityType)) {
    return null;
  }
  if (typeof group !== 'string' || !SEARCH_GROUP_IDS.has(group as SearchGroupId)) {
    return null;
  }
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    typeof value.subtitle !== 'string' ||
    !isNonEmptyString(value.href) ||
    !isNonEmptyString(value.occurredAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    group: group as SearchGroupId,
    entityType: entityType as SearchEntityType,
    title: value.title,
    subtitle: value.subtitle,
    href: value.href,
    occurredAt: value.occurredAt,
  };
}

export function parseGlobalSearchRecentState(raw: string | null): GlobalSearchRecentState {
  if (!raw) return { ...DEFAULT_RECENT_STATE, items: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
      return { ...DEFAULT_RECENT_STATE, items: [] };
    }
    const items: SearchHit[] = [];
    for (const item of parsed.items) {
      const hit = parseSearchHit(item);
      if (hit) items.push(hit);
      if (items.length === GLOBAL_SEARCH_RECENT_LIMIT) break;
    }
    return { items };
  } catch {
    return { ...DEFAULT_RECENT_STATE, items: [] };
  }
}

export function prependGlobalSearchRecentHit(
  items: readonly SearchHit[],
  hit: SearchHit,
  usedAt = new Date().toISOString(),
): SearchHit[] {
  const snapshot = parseSearchHit({ ...hit, occurredAt: usedAt });
  if (!snapshot) return [...items].slice(0, GLOBAL_SEARCH_RECENT_LIMIT);
  const key = recentSearchHitKey(snapshot);
  return [snapshot, ...items.filter((item) => recentSearchHitKey(item) !== key)].slice(
    0,
    GLOBAL_SEARCH_RECENT_LIMIT,
  );
}

const recentHitsStore = createPersistedJsonStore<GlobalSearchRecentState>({
  storageKey: GLOBAL_SEARCH_RECENT_STORAGE_KEY,
  defaultValue: DEFAULT_RECENT_STATE,
  changeEvent: 'nbos:global-search:recent-hits-change',
  parse: parseGlobalSearchRecentState,
});

/** Persist an opened search hit at the front of the local recent list. */
export function rememberGlobalSearchRecentHit(hit: SearchHit): void {
  const { items } = recentHitsStore.read();
  recentHitsStore.write({ items: prependGlobalSearchRecentHit(items, hit) });
}

export function useGlobalSearchRecentHits(): SearchHit[] {
  const [state] = recentHitsStore.useValue();
  return state.items;
}
