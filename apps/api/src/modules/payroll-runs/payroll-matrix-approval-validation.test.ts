import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';
import { validatePayrollMatrixForApproval } from './payroll-matrix-approval-validation';

describe('validatePayrollMatrixForApproval', () => {
  it('does not block EXTRA or OVER_FUNDING releases without reason', async () => {
    const prisma = {
      bonusRelease: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
      salaryLine: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const issues = await validatePayrollMatrixForApproval(prisma as never, 'run1');
    expect(issues).toHaveLength(0);
  });

  it('flags salary line bonus mismatch', async () => {
    const prisma = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([]),
        aggregate: vi
          .fn()
          .mockResolvedValue({ _sum: { payrollIncludedAmount: new Decimal(50), amount: null } }),
      },
      salaryLine: {
        findMany: vi.fn().mockResolvedValue([
          {
            employeeId: 'e1',
            bonusesTotal: new Decimal(100),
            employee: { firstName: 'A', lastName: 'B' },
          },
        ]),
      },
    };

    const issues = await validatePayrollMatrixForApproval(prisma as never, 'run1');
    expect(issues.some((i) => i.code === 'SALARY_LINE_BONUS_MISMATCH')).toBe(true);
  });
});
