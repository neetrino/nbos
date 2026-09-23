import { describe, expect, it, vi } from 'vitest';
import { CATALOG_FIRST_PAINT_PAGE_SIZE } from './function-catalog.constants';

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

describe('loadCatalogQuery first paint', () => {
  it('paints five card rows before the remaining pages', async () => {
    const { loadCatalogQuery } = await import('./load-function-catalog-query');
    const firstItems = Array.from({ length: 5 }, (_, index) => ({ id: `fn-${index}` }));
    list.mockResolvedValue({ items: firstItems, meta: { total: 12, page: 1, pageSize: 5 } });
    listAll.mockResolvedValue([...firstItems, { id: 'fn-5' }]);
    const paints: string[][] = [];

    const loaded = await loadCatalogQuery({
      search: '',
      canSeeRules: false,
      hasVisibleItems: false,
      onFirstPaint: (snapshot) => {
        paints.push(snapshot.items.map((item) => item.id));
      },
    });

    expect(CATALOG_FIRST_PAINT_PAGE_SIZE).toBe(5);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 5 }));
    expect(paints).toEqual([['fn-0', 'fn-1', 'fn-2', 'fn-3', 'fn-4']]);
    expect(loaded.items).toHaveLength(6);
    expect(listAll).toHaveBeenCalledOnce();
  });

  it('skips the first-five hop when cards are already on screen', async () => {
    const { loadCatalogQuery } = await import('./load-function-catalog-query');
    list.mockClear();
    listAll.mockResolvedValue([{ id: 'fn-0' }]);
    const onFirstPaint = vi.fn();

    await loadCatalogQuery({
      search: '',
      canSeeRules: false,
      hasVisibleItems: true,
      onFirstPaint,
    });

    expect(list).not.toHaveBeenCalled();
    expect(onFirstPaint).not.toHaveBeenCalled();
    expect(listAll).toHaveBeenCalled();
  });
});
