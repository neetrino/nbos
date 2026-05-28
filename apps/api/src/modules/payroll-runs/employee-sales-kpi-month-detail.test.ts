import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { buildEmployeeSalesKpiDetailFromResult } from './employee-sales-kpi-month-detail';

describe('buildEmployeeSalesKpiDetailFromResult', () => {
  it('returns NO_KPI_POLICY with 100% label when employee has no policy', () => {
    const detail = buildEmployeeSalesKpiDetailFromResult({
      kpiPolicyId: null,
      result: null,
    });
    expect(detail.source).toBe('NO_KPI_POLICY');
    expect(detail.effectivePayoutScaleLabel).toContain('100%');
  });

  it('returns NOT_SYNCED when policy exists but snapshot is missing', () => {
    const detail = buildEmployeeSalesKpiDetailFromResult({
      kpiPolicyId: 'kp1',
      result: null,
    });
    expect(detail.source).toBe('NOT_SYNCED');
    expect(detail.planAmount).toBeNull();
  });

  it('maps KPI_RESULT snapshot fields', () => {
    const detail = buildEmployeeSalesKpiDetailFromResult({
      kpiPolicyId: 'kp1',
      result: {
        planAmount: new Decimal(1000),
        actualAmount: new Decimal(600),
        attainmentPct: new Decimal(60),
        payoutFactor: new Decimal('0.5'),
      },
    });
    expect(detail.source).toBe('KPI_RESULT');
    expect(detail.planAmount).toBe('1000.00');
    expect(detail.actualAmount).toBe('600.00');
    expect(detail.payoutFactor).toBe('0.5000');
    expect(detail.effectivePayoutScaleLabel).toContain('50%');
  });
});
