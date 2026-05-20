import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Subscription } from '@/lib/api/subscriptions';
import { subscriptionsApi } from '@/lib/api/finance';
import { fetchAllSubscriptionsForExport } from './fetch-all-subscriptions-for-export';

vi.mock('@/lib/api/finance', () => ({
  subscriptionsApi: {
    getAll: vi.fn(),
  },
}));

const mockRow = (id: string): Subscription => ({
  id,
  code: `S-${id}`,
  projectId: 'p1',
  type: 'MONTHLY',
  baseMonthlyAmount: '1.00',
  billingFrequency: 'MONTHLY',
  billingDay: 1,
  taxStatus: 'TAX',
  status: 'ACTIVE',
  billingStartDate: '2026-01-01',
  notificationsEnabled: true,
  endDate: null,
  createdAt: '2026-04-01T00:00:00.000Z',
  project: { id: 'p1', code: 'P', name: 'Proj' },
  company: null,
  contact: null,
  partner: null,
  invoices: [],
});

describe('fetchAllSubscriptionsForExport', () => {
  const getAll = vi.mocked(subscriptionsApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllSubscriptionsForExport({})).resolves.toEqual([]);
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
        items: [mockRow('1'), mockRow('2')],
        meta: { total: 3, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [mockRow('3')],
        meta: { total: 3, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllSubscriptionsForExport({ status: 'ACTIVE' });
    expect(rows).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, pageSize: 500, status: 'ACTIVE' }),
    );
  });
});
