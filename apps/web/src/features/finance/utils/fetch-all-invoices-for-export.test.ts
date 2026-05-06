import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Invoice } from '@/lib/api/finance';
import { invoicesApi } from '@/lib/api/finance';
import { fetchAllInvoicesForExport } from './fetch-all-invoices-for-export';

vi.mock('@/lib/api/finance', () => ({
  invoicesApi: {
    getAll: vi.fn(),
  },
}));

const mockInvoice = (id: string): Invoice => ({
  id,
  code: `C-${id}`,
  orderId: null,
  subscriptionId: null,
  projectId: 'p1',
  companyId: null,
  amount: '1.00',
  currency: 'USD',
  taxStatus: 'TAX',
  type: 'STANDARD',
  moneyStatus: 'NEW',
  dueDate: null,
  paidDate: null,
  govInvoiceId: null,
  description: null,
  createdAt: '2026-04-01T00:00:00.000Z',
  order: null,
  company: null,
  project: null,
  contact: null,
  payments: [],
  _count: { payments: 0 },
});

describe('fetchAllInvoicesForExport', () => {
  const getAll = vi.mocked(invoicesApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(fetchAllInvoicesForExport({})).resolves.toEqual([]);
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
        items: [mockInvoice('1'), mockInvoice('2')],
        meta: { total: 3, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [mockInvoice('3')],
        meta: { total: 3, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllInvoicesForExport({ moneyStatus: 'NEW' });
    expect(rows).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, pageSize: 500, moneyStatus: 'NEW' }),
    );
    expect(getAll).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2, pageSize: 500, moneyStatus: 'NEW' }),
    );
  });
});
