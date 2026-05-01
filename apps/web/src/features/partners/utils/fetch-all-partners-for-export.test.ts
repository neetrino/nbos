import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Partner } from '@/lib/api/partners';
import { partnersApi } from '@/lib/api/partners';
import { fetchAllPartnersForExport } from './fetch-all-partners-for-export';

vi.mock('@/lib/api/partners', () => ({
  partnersApi: {
    getAll: vi.fn(),
  },
}));

const mockPartner = (id: string): Partner => ({
  id,
  name: `N-${id}`,
  type: 'REGULAR',
  direction: 'OUTBOUND',
  defaultPercent: '5',
  status: 'ACTIVE',
  contactId: null,
  createdAt: '2026-04-01T00:00:00.000Z',
});

describe('fetchAllPartnersForExport', () => {
  const getAll = vi.mocked(partnersApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllPartnersForExport({})).resolves.toEqual([]);
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
        items: [mockPartner('1'), mockPartner('2')],
        meta: { total: 3, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [mockPartner('3')],
        meta: { total: 3, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllPartnersForExport({ search: 'N' });
    expect(rows).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, pageSize: 500, search: 'N' }),
    );
  });
});
