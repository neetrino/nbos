import { describe, expect, it, vi } from 'vitest';
import { CATALOG_PAGE_SIZE } from './function-catalog.constants';

vi.mock('@/lib/api/delivery-catalog-structure', () => ({
  deliveryCatalogStructureApi: { listSalePrices: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/api/delivery-norms', () => ({
  deliveryNormsApi: { listFunctionPrices: vi.fn().mockResolvedValue([]) },
}));

const list = vi.fn();
const listAll = vi.fn();

vi.mock('@/lib/api/delivery-functions', () => ({
  deliveryFunctionsApi: {
    list: (...args: unknown[]) => list(...args),
    listAll: (...args: unknown[]) => listAll(...args),
  },
}));

describe('loadCatalogPage', () => {
  it('loads one visible page and does not pull the rest', async () => {
    const { loadCatalogPage } = await import('./load-function-catalog-query');
    const firstItems = Array.from({ length: 12 }, (_, index) => ({
      id: `fn-${index}`,
      category: 'commerce',
    }));
    list.mockResolvedValue({
      items: firstItems,
      meta: { total: 40, page: 1, pageSize: 12, categoryCounts: { commerce: 40 } },
    });

    const loaded = await loadCatalogPage({
      filters: { search: '' },
      page: 1,
      canSeeRules: false,
    });

    expect(CATALOG_PAGE_SIZE).toBe(12);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 12 }));
    expect(loaded.items).toHaveLength(12);
    expect(loaded.total).toBe(40);
    expect(loaded.categoryCounts).toEqual({ commerce: 40 });
    expect(listAll).not.toHaveBeenCalled();
  });
});

describe('loadFullCatalog', () => {
  it('uses listAll when a caller needs every card', async () => {
    const { loadFullCatalog } = await import('./load-function-catalog-query');
    listAll.mockResolvedValue([{ id: 'fn-0', category: 'commerce' }]);

    const loaded = await loadFullCatalog({ filters: { search: '' }, canSeeRules: false });

    expect(listAll).toHaveBeenCalled();
    expect(loaded.items).toHaveLength(1);
    expect(loaded.categoryCounts).toEqual({ commerce: 1 });
  });
});
