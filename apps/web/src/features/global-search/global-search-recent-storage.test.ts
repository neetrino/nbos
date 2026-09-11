import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { SearchHit } from '@/lib/api/search';
import {
  GLOBAL_SEARCH_RECENT_LIMIT,
  GLOBAL_SEARCH_RECENT_STORAGE_KEY,
  parseGlobalSearchRecentState,
  prependGlobalSearchRecentHit,
  rememberGlobalSearchRecentHit,
} from './global-search-recent-storage';

const USED_AT = '2026-09-08T12:00:00.000Z';

function hit(overrides: Partial<SearchHit> = {}): SearchHit {
  return {
    id: 'prod-1',
    group: 'products',
    entityType: 'product',
    title: 'Alpha site',
    subtitle: 'Active project',
    href: '/projects/prod-1',
    occurredAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('global-search-recent-storage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses an empty or corrupt payload as no recents', () => {
    expect(parseGlobalSearchRecentState(null).items).toEqual([]);
    expect(parseGlobalSearchRecentState('not-json').items).toEqual([]);
    expect(parseGlobalSearchRecentState('{"items":"nope"}').items).toEqual([]);
  });

  it('skips invalid hits and caps the stored list', () => {
    const items = Array.from({ length: GLOBAL_SEARCH_RECENT_LIMIT + 2 }, (_, index) =>
      hit({ id: `prod-${index}` }),
    );
    items.push({ ...hit({ id: 'bad' }), entityType: 'unknown' as SearchHit['entityType'] });
    const parsed = parseGlobalSearchRecentState(JSON.stringify({ items }));
    expect(parsed.items).toHaveLength(GLOBAL_SEARCH_RECENT_LIMIT);
    expect(parsed.items.some((item) => item.id === 'bad')).toBe(false);
  });

  it('prepends a used hit and moves a duplicate to the front', () => {
    const first = hit({ id: 'a', title: 'A' });
    const second = hit({ id: 'b', title: 'B' });
    const once = prependGlobalSearchRecentHit([], first, USED_AT);
    const twice = prependGlobalSearchRecentHit(once, second, USED_AT);
    const again = prependGlobalSearchRecentHit(twice, { ...first, title: 'A updated' }, USED_AT);

    expect(twice.map((item) => item.id)).toEqual(['b', 'a']);
    expect(again.map((item) => item.id)).toEqual(['a', 'b']);
    expect(again[0]?.title).toBe('A updated');
    expect(again[0]?.occurredAt).toBe(USED_AT);
  });

  it('persists the opened hit, not the search query', () => {
    rememberGlobalSearchRecentHit(hit());
    const raw = window.localStorage.getItem(GLOBAL_SEARCH_RECENT_STORAGE_KEY);
    expect(raw).toContain('Alpha site');
    expect(raw).not.toContain('q=');
    expect(parseGlobalSearchRecentState(raw).items[0]?.id).toBe('prod-1');
  });
});
