import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Order } from '@/lib/api/finance';
import { ordersApi } from '@/lib/api/finance';
import { fetchAllOrdersForExport } from './fetch-all-orders-for-export';

vi.mock('@/lib/api/finance', () => ({
  ordersApi: {
    getAll: vi.fn(),
  },
}));

const mockOrder = (id: string): Order => ({
  id,
  code: `O-${id}`,
  projectId: 'p1',
  type: 'SALE',
  paymentType: 'ONE_TIME',
  totalAmount: '1.00',
  currency: 'USD',
  status: 'OPEN',
  createdAt: '2026-04-01T00:00:00.000Z',
  project: { id: 'p1', code: 'P', name: 'Proj' },
  company: null,
  contact: null,
  invoices: [],
});

describe('fetchAllOrdersForExport', () => {
  const getAll = vi.mocked(ordersApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllOrdersForExport({})).resolves.toEqual([]);
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 500,
      }),
    );
  });

  it('aggregates multiple pages', async () => {
    getAll
      .mockResolvedValueOnce({
        items: [mockOrder('1'), mockOrder('2')],
        meta: { total: 3, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [mockOrder('3')],
        meta: { total: 3, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllOrdersForExport({ gap: 'uninvoiced' });
    expect(rows).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, pageSize: 500, gap: 'uninvoiced' }),
    );
  });
});
