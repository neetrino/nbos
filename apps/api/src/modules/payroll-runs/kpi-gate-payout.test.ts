import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { computeKpiGatePayoutFactor } from './kpi-gate-payout';
import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';

describe('computeKpiGatePayoutFactor', () => {
  it('uses default bands like legacy sales gate', () => {
    expect(
      computeKpiGatePayoutFactor(
        new Decimal(1000),
        new Decimal(700),
        DEFAULT_KPI_GATE_RULES,
      ).toString(),
    ).toBe('1');
    expect(
      computeKpiGatePayoutFactor(
        new Decimal(1000),
        new Decimal(600),
        DEFAULT_KPI_GATE_RULES,
      ).toString(),
    ).toBe('0.5');
    expect(
      computeKpiGatePayoutFactor(
        new Decimal(1000),
        new Decimal(400),
        DEFAULT_KPI_GATE_RULES,
      ).toString(),
    ).toBe('0');
  });

  it('supports custom policy bands', () => {
    const rules = {
      bands: [
        { minAttainmentPct: 80, payoutFactor: 1 },
        { minAttainmentPct: 0, payoutFactor: 0.25 },
      ],
    };
    expect(computeKpiGatePayoutFactor(new Decimal(100), new Decimal(85), rules).toString()).toBe(
      '1',
    );
    expect(computeKpiGatePayoutFactor(new Decimal(100), new Decimal(50), rules).toString()).toBe(
      '0.25',
    );
  });
});
