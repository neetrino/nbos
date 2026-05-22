import { describe, expect, it } from 'vitest';
import { buildSalesKpiGateSummary, salesKpiPayoutScaleLabel } from './sales-kpi-gate-summary';

describe('salesKpiPayoutScaleLabel', () => {
  it('returns full scale at 70%+', () => {
    expect(salesKpiPayoutScaleLabel(1000, 700)).toBe('100%');
  });

  it('returns half scale between 50% and 70%', () => {
    expect(salesKpiPayoutScaleLabel(1000, 600)).toBe('50%');
  });

  it('returns zero below 50%', () => {
    expect(salesKpiPayoutScaleLabel(1000, 400)).toBe('0%');
  });
});

describe('buildSalesKpiGateSummary', () => {
  it('returns null when KPI unset', () => {
    expect(buildSalesKpiGateSummary(null, null)).toBeNull();
  });

  it('describes attainment when both set', () => {
    expect(buildSalesKpiGateSummary('1000', '600')).toContain('60%');
    expect(buildSalesKpiGateSummary('1000', '600')).toContain('50%');
  });
});
