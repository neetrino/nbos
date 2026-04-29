import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Payment } from '@/lib/api/finance';
import { paymentsApi } from '@/lib/api/finance';
import { fetchAllPaymentsForExport } from './fetch-all-payments-for-export';

vi.mock('@/lib/api/finance', () => ({
  paymentsApi: {
    getAll: vi.fn(),
  },
}));

const mockPayment = (id: string): Payment => ({
  id,
  invoiceId: 'inv-1',
  amount: '1.00',
  paymentDate: '2026-04-01',
  paymentMethod: null,
  confirmedBy: null,
  notes: null,
  createdAt: '2026-04-01T00:00:00.000Z',
});

describe('fetchAllPaymentsForExport', () => {
  const getAll = vi.mocked(paymentsApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllPaymentsForExport({})).resolves.toEqual([]);
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
        items: [mockPayment('1'), mockPayment('2')],
        meta: { total: 3, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [mockPayment('3')],
        meta: { total: 3, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllPaymentsForExport({ search: 'INV' });
    expect(rows).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, pageSize: 500, search: 'INV' }),
    );
  });
});
