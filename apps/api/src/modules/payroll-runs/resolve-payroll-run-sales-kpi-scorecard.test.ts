import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KPI_POLICY_ID } from '../compensation-profiles/default-kpi-policy-id';
import { resolvePayrollRunSalesKpiScorecardMetrics } from './resolve-payroll-run-sales-kpi-scorecard';

vi.mock('../compensation-profiles/resolve-active-compensation-profile', () => ({
  resolveCompensationProfileForPayrollMonth: vi.fn(),
}));

import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';

describe('resolvePayrollRunSalesKpiScorecardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads metrics from the dominant employee KPI policy', async () => {
    vi.mocked(resolveCompensationProfileForPayrollMonth)
      .mockResolvedValueOnce({
        id: 'p1',
        baseSalary: { toString: () => '0' },
        currency: 'USD',
        kpiPolicyId: 'kpi-a',
      })
      .mockResolvedValueOnce({
        id: 'p2',
        baseSalary: { toString: () => '0' },
        currency: 'USD',
        kpiPolicyId: 'kpi-b',
      })
      .mockResolvedValueOnce({
        id: 'p3',
        baseSalary: { toString: () => '0' },
        currency: 'USD',
        kpiPolicyId: 'kpi-a',
      });

    const kpiPolicy = {
      findFirst: vi.fn().mockResolvedValue({
        scorecardMetrics: [
          {
            code: 'REVENUE_TARGET',
            label: 'Target',
            period: 'MONTH',
            payrollField: 'kpiSalesPlanAmount',
          },
        ],
      }),
    };

    const metrics = await resolvePayrollRunSalesKpiScorecardMetrics(
      { compensationProfile: {} as never, kpiPolicy },
      '2026-05',
      ['e1', 'e2', 'e3'],
    );

    expect(kpiPolicy.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'kpi-a', status: 'ACTIVE' } }),
    );
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.payrollField).toBe('kpiSalesPlanAmount');
  });

  it('falls back to default policy when there are no salary lines', async () => {
    const kpiPolicy = {
      findFirst: vi.fn().mockResolvedValue({ scorecardMetrics: [] }),
    };

    await resolvePayrollRunSalesKpiScorecardMetrics(
      { compensationProfile: {} as never, kpiPolicy },
      '2026-05',
      [],
    );

    expect(kpiPolicy.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: DEFAULT_KPI_POLICY_ID, status: 'ACTIVE' } }),
    );
    expect(resolveCompensationProfileForPayrollMonth).not.toHaveBeenCalled();
  });
});
