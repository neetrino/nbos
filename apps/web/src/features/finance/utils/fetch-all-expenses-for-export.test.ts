import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Expense } from '@/lib/api/finance';
import { expensesApi } from '@/lib/api/finance';
import { fetchAllExpensesForExport } from './fetch-all-expenses-for-export';

vi.mock('@/lib/api/finance', () => ({
  expensesApi: {
    getAll: vi.fn(),
  },
}));

const mockExpense = (id: string): Expense =>
  ({
    id,
    type: 'PLANNED',
    category: 'TOOLS',
    name: 'Test',
    amount: '1',
    frequency: 'ONE_TIME',
    dueDate: null,
    status: 'THIS_MONTH',
    projectId: null,
    isPassThrough: false,
    taxStatus: 'TAX',
    backlogReason: null,
    notes: null,
    createdAt: '2026-04-28T12:00:00.000Z',
  }) satisfies Expense;

describe('fetchAllExpensesForExport', () => {
  const getAll = vi.mocked(expensesApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllExpensesForExport({})).resolves.toEqual([]);
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 500 }));
  });

  it('stops after one page when totalPages is 1', async () => {
    const items = [mockExpense('a')];
    getAll.mockResolvedValueOnce({
      items,
      meta: { total: 1, page: 1, pageSize: 500, totalPages: 1 },
    });
    await expect(
      fetchAllExpensesForExport({ sortBy: 'createdAt', sortOrder: 'desc' }),
    ).resolves.toEqual(items);
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  it('requests further pages until totalPages is reached', async () => {
    const first = Array.from({ length: 500 }, (_, i) => mockExpense(`p1-${i}`));
    const second = [mockExpense('p2-0')];
    getAll
      .mockResolvedValueOnce({
        items: first,
        meta: { total: 501, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: second,
        meta: { total: 501, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllExpensesForExport({});
    expect(rows).toHaveLength(501);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2, pageSize: 500 }));
  });
});
