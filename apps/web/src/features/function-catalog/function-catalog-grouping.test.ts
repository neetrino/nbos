import { DELIVERY_FUNCTION_CATEGORIES } from '@nbos/shared';
import { describe, expect, it } from 'vitest';
import {
  FUNCTION_CATALOG_ALL_ID,
  FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS,
  FUNCTION_CATALOG_OTHER_ID,
} from './function-catalog.constants';
import {
  buildCatalogRailEntries,
  buildCatalogRailFromCounts,
  countFunctionsByCategory,
  filterCatalogItems,
  groupFunctionsIntoCategoryBlocks,
  matchesCatalogSearch,
} from './function-catalog-grouping';

const PAYMENTS = item('1', 'payments', 'Checkout');
const COMMERCE = item('2', 'commerce', 'Cart');
const UNKNOWN = item('3', 'legacy-ops', 'Old ops');
const AI = item('4', 'ai', 'Assistant');

function item(id: string, category: string, title: string) {
  return {
    id,
    category,
    title,
    summary: `${title} summary`,
    code: title.toUpperCase(),
  };
}

describe('groupFunctionsIntoCategoryBlocks', () => {
  it('renders canonical category blocks in rail order, then Other', () => {
    const blocks = groupFunctionsIntoCategoryBlocks(
      [UNKNOWN, AI, PAYMENTS, COMMERCE],
      FUNCTION_CATALOG_ALL_ID,
    );
    expect(blocks.map((block) => block.id)).toEqual(['payments', 'commerce', 'ai', 'other']);
    expect(blocks[0]?.items.map((row) => row.id)).toEqual(['1']);
    expect(blocks[3]?.items.map((row) => row.id)).toEqual(['3']);
  });

  it('omits empty canonical categories from the All view', () => {
    const blocks = groupFunctionsIntoCategoryBlocks([PAYMENTS], FUNCTION_CATALOG_ALL_ID);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.id).toBe('payments');
  });

  it('renders only the selected category block', () => {
    const blocks = groupFunctionsIntoCategoryBlocks([PAYMENTS, COMMERCE, UNKNOWN], 'commerce');
    expect(blocks).toEqual([{ id: 'commerce', items: [COMMERCE] }]);
  });

  it('routes unknown categories into Other and keeps them reachable', () => {
    const blocks = groupFunctionsIntoCategoryBlocks([UNKNOWN, PAYMENTS], FUNCTION_CATALOG_OTHER_ID);
    expect(blocks).toEqual([{ id: FUNCTION_CATALOG_OTHER_ID, items: [UNKNOWN] }]);
  });
});

describe('countFunctionsByCategory', () => {
  it('counts canonical categories and buckets unknown keys as Other', () => {
    const counts = countFunctionsByCategory([PAYMENTS, PAYMENTS, UNKNOWN, AI]);
    expect(counts.get('payments')).toBe(2);
    expect(counts.get('ai')).toBe(1);
    expect(counts.get(FUNCTION_CATALOG_OTHER_ID)).toBe(1);
    expect(counts.get('commerce')).toBeUndefined();
  });
});

describe('buildCatalogRailEntries', () => {
  it('starts with All, then every canonical category, then Other when needed', () => {
    const entries = buildCatalogRailEntries([PAYMENTS, UNKNOWN]);
    expect(entries[0]).toEqual({ id: FUNCTION_CATALOG_ALL_ID, count: 2 });
    expect(
      entries.slice(1, 1 + DELIVERY_FUNCTION_CATEGORIES.length).map((entry) => entry.id),
    ).toEqual([...DELIVERY_FUNCTION_CATEGORIES]);
    expect(entries.at(-1)).toEqual({ id: FUNCTION_CATALOG_OTHER_ID, count: 1 });
    expect(entries.find((entry) => entry.id === 'payments')?.count).toBe(1);
    expect(entries.find((entry) => entry.id === 'commerce')?.count).toBe(0);
  });

  it('omits Other when every function uses a canonical category', () => {
    const entries = buildCatalogRailEntries([PAYMENTS]);
    expect(entries.some((entry) => entry.id === FUNCTION_CATALOG_OTHER_ID)).toBe(false);
  });

  it('builds the same rail from API category counts', () => {
    const entries = buildCatalogRailFromCounts(3, { payments: 2, 'legacy-ops': 1 });
    expect(entries[0]).toEqual({ id: FUNCTION_CATALOG_ALL_ID, count: 3 });
    expect(entries.find((entry) => entry.id === 'payments')?.count).toBe(2);
    expect(entries.at(-1)).toEqual({ id: FUNCTION_CATALOG_OTHER_ID, count: 1 });
  });
});

describe('FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS', () => {
  it('covers All, Other, and every canonical category', () => {
    const keys = Object.keys(FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS);
    expect(keys).toEqual(['all', 'other', ...DELIVERY_FUNCTION_CATEGORIES]);
  });
});

describe('filterCatalogItems', () => {
  const items = [PAYMENTS, COMMERCE, UNKNOWN];

  it('keeps every item when the query is blank', () => {
    expect(filterCatalogItems(items, '  ')).toEqual(items);
  });

  it('matches title, summary, code, and category', () => {
    expect(filterCatalogItems(items, 'cart').map((row) => row.id)).toEqual(['2']);
    expect(filterCatalogItems(items, 'CHECKOUT').map((row) => row.id)).toEqual(['1']);
    expect(filterCatalogItems(items, 'legacy-ops').map((row) => row.id)).toEqual(['3']);
    expect(matchesCatalogSearch(PAYMENTS, 'checkout summary')).toBe(true);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterCatalogItems(items, 'warehouse')).toEqual([]);
  });
});
