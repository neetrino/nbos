import { describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';

import { resolveCompensationPayrollPolicyForEmployee } from './resolve-compensation-payroll-policy';
import { DEFAULT_KPI_GATE_RULES } from '../payroll-runs/default-kpi-gate-rules';

describe('resolveCompensationPayrollPolicyForEmployee', () => {
  it('returns defaults when no profile', async () => {
    const db = {
      compensationProfile: { findFirst: vi.fn().mockResolvedValue(null) },
      kpiPolicy: { findFirst: vi.fn() },
    };
    const policy = await resolveCompensationPayrollPolicyForEmployee(db as never, 'e1', '2026-05');
    expect(policy.gateRules).toEqual(DEFAULT_KPI_GATE_RULES);
    expect(policy.bonusCapBaseSalaryMultiplier.toString()).toBe('2');
  });

  it('loads cap multiplier from active KPI policy', async () => {
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
        findFirst: vi.fn().mockResolvedValue({
          gateRules: DEFAULT_KPI_GATE_RULES,
          bonusCapBaseSalaryMultiplier: new Decimal(2.5),
        }),
      },
    };
    const policy = await resolveCompensationPayrollPolicyForEmployee(db as never, 'e1', '2026-05');
    expect(policy.bonusCapBaseSalaryMultiplier.toString()).toBe('2.5');
  });
});
