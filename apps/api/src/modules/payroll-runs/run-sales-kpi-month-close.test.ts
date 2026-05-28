import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { runSalesKpiMonthClose } from './run-sales-kpi-month-close';

vi.mock('./sync-sales-kpi-line', () => ({
  syncSalesKpiForEarnedPeriodEmployee: vi.fn(),
}));

import { syncSalesKpiForEarnedPeriodEmployee } from './sync-sales-kpi-line';

describe('runSalesKpiMonthClose', () => {
  it('syncs KPI for each distinct employee with an active KPI policy', async () => {
    const prisma: MockPrisma = createMockPrisma();
    prisma.compensationProfile.findMany.mockResolvedValue([
      { employeeId: 'e1' },
      { employeeId: 'e2' },
    ]);
    vi.mocked(syncSalesKpiForEarnedPeriodEmployee)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await runSalesKpiMonthClose(prisma as never, { earnedPeriod: '2026-03' });

    expect(result).toEqual({
      earnedPeriod: '2026-03',
      syncedCount: 1,
      skippedCount: 1,
    });
    expect(syncSalesKpiForEarnedPeriodEmployee).toHaveBeenCalledTimes(2);
    expect(syncSalesKpiForEarnedPeriodEmployee).toHaveBeenCalledWith(prisma, {
      employeeId: 'e1',
      earnedPeriod: '2026-03',
    });
  });
});
