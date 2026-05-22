import { describe, it, expect, vi } from 'vitest';
import { resolveCompensationProfileForPayrollMonth } from './resolve-active-compensation-profile';

describe('resolveCompensationProfileForPayrollMonth', () => {
  it('queries ACTIVE profile overlapping payroll month', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'cp-1',
      baseSalary: { toString: () => '120000' },
      currency: 'AMD',
      kpiPolicyId: 'pol-1',
    });
    const db = { compensationProfile: { findFirst } };

    const result = await resolveCompensationProfileForPayrollMonth(db as never, 'emp-1', '2026-05');

    expect(result?.id).toBe('cp-1');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId: 'emp-1',
          status: 'ACTIVE',
        }),
      }),
    );
  });
});
