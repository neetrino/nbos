import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { expensePlansApi } from '@/lib/api/expense-plans';
import { fetchAllExpensePlansForExport } from './fetch-all-expense-plans-for-export';

vi.mock('@/lib/api/expense-plans', () => ({
  expensePlansApi: {
    getAll: vi.fn(),
  },
}));

function mockPlan(id: string): ExpensePlan {
  return {
    id,
    name: `Plan ${id}`,
    category: 'cat',
    amount: '10.00',
    frequency: 'MONTHLY',
    nextDueDate: null,
    provider: null,
    projectId: null,
    autoGenerate: false,
    notes: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    project: null,
    _count: { expenses: 0 },
  };
}

describe('fetchAllExpensePlansForExport', () => {
  const getAll = vi.mocked(expensePlansApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllExpensePlansForExport({})).resolves.toEqual([]);
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
        items: [mockPlan('1'), mockPlan('2')],
        meta: { total: 3, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [mockPlan('3')],
        meta: { total: 3, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllExpensePlansForExport({ search: 'rent' });
    expect(rows).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, pageSize: 500, search: 'rent' }),
    );
  });
});
