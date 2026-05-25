import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { computeAdvisoryKpiHeldAmount } from './bonus-pool-kpi-held';

describe('computeAdvisoryKpiHeldAmount', () => {
  it('returns null when KPI gate is not false', () => {
    expect(computeAdvisoryKpiHeldAmount(new Decimal(100), new Decimal(0), null)).toBeNull();
    expect(computeAdvisoryKpiHeldAmount(new Decimal(100), new Decimal(0), true)).toBeNull();
  });

  it('returns planned minus released when KPI gate failed', () => {
    const held = computeAdvisoryKpiHeldAmount(new Decimal(100), new Decimal(30), false);
    expect(held?.toFixed(2)).toBe('70.00');
  });
});
