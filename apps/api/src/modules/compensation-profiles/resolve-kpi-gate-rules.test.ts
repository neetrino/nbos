import { describe, expect, it, vi } from 'vitest';

import { resolveKpiGateRulesForPayrollEmployee } from './resolve-kpi-gate-rules';
import { DEFAULT_KPI_GATE_RULES } from '../payroll-runs/default-kpi-gate-rules';

describe('resolveKpiGateRulesForPayrollEmployee', () => {
  it('returns default when no active profile', async () => {
    const db = {
      compensationProfile: { findFirst: vi.fn().mockResolvedValue(null) },
      kpiPolicy: { findFirst: vi.fn() },
    };
    const rules = await resolveKpiGateRulesForPayrollEmployee(db as never, 'e1', '2026-05');
    expect(rules).toEqual(DEFAULT_KPI_GATE_RULES);
  });

  it('loads gate rules from active KPI policy', async () => {
    const custom = {
      bands: [
        { minAttainmentPct: 90, payoutFactor: 1 },
        { minAttainmentPct: 0, payoutFactor: 0 },
      ],
    };
    const db = {
      compensationProfile: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'cp1',
          baseSalary: { toString: () => '100' },
          currency: 'AMD',
          kpiPolicyId: 'pol1',
        }),
      },
      kpiPolicy: {
        findFirst: vi.fn().mockResolvedValue({ gateRules: custom }),
      },
    };
    const rules = await resolveKpiGateRulesForPayrollEmployee(db as never, 'e1', '2026-05');
    expect(rules.bands[0]?.minAttainmentPct).toBe(90);
  });
});
