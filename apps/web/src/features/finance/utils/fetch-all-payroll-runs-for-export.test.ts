import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';
import { payrollRunsApi } from '@/lib/api/payroll-runs';
import { fetchAllPayrollRunsForExport } from './fetch-all-payroll-runs-for-export';

vi.mock('@/lib/api/payroll-runs', () => ({
  payrollRunsApi: {
    getAll: vi.fn(),
  },
}));

const mockRun = (id: string): PayrollRunListRow => ({
  id,
  payrollMonth: '2026-04',
  status: 'DRAFT',
  totalBaseSalary: '0',
  totalBonuses: '0',
  totalAdjustments: '0',
  totalDeductions: '0',
  totalPayable: '0',
  totalPaid: '0',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  _count: { salaryLines: 1 },
  materializedExpenseLineCount: 0,
});

describe('fetchAllPayrollRunsForExport', () => {
  const getAll = vi.mocked(payrollRunsApi.getAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when first page has no items', async () => {
    getAll.mockResolvedValueOnce({
      items: [],
      meta: { total: 0, page: 1, pageSize: 500, totalPages: 0 },
    });
    await expect(
      fetchAllPayrollRunsForExport({ sortBy: 'payrollMonth', sortOrder: 'desc' }),
    ).resolves.toEqual([]);
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 500,
        sortBy: 'payrollMonth',
        sortOrder: 'desc',
      }),
    );
  });

  it('passes payroll month range to API', async () => {
    getAll.mockResolvedValueOnce({
      items: [mockRun('a')],
      meta: { total: 1, page: 1, pageSize: 500, totalPages: 1 },
    });
    await fetchAllPayrollRunsForExport({
      payrollMonthFrom: '2026-01',
      payrollMonthTo: '2026-03',
      sortBy: 'payrollMonth',
      sortOrder: 'desc',
    });
    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        payrollMonthFrom: '2026-01',
        payrollMonthTo: '2026-03',
        page: 1,
        pageSize: 500,
      }),
    );
  });

  it('passes status filter to API', async () => {
    getAll.mockResolvedValueOnce({
      items: [mockRun('a')],
      meta: { total: 1, page: 1, pageSize: 500, totalPages: 1 },
    });
    await fetchAllPayrollRunsForExport({
      status: 'CLOSED',
      sortBy: 'payrollMonth',
      sortOrder: 'desc',
    });
    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'CLOSED', page: 1, pageSize: 500 }),
    );
  });

  it('requests further pages until totalPages is reached', async () => {
    const first = Array.from({ length: 500 }, (_, i) => mockRun(`p1-${i}`));
    const second = [mockRun('p2-0')];
    getAll
      .mockResolvedValueOnce({
        items: first,
        meta: { total: 501, page: 1, pageSize: 500, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: second,
        meta: { total: 501, page: 2, pageSize: 500, totalPages: 2 },
      });
    const rows = await fetchAllPayrollRunsForExport({ sortBy: 'payrollMonth', sortOrder: 'desc' });
    expect(rows).toHaveLength(501);
    expect(getAll).toHaveBeenCalledTimes(2);
  });
});
