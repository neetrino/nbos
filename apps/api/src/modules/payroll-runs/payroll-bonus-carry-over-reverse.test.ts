import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import {
  restorePriorPayrollCarryConsumed,
  reversePayrollCarryAppliedOnSalaryLine,
} from './payroll-bonus-carry-over-reverse';

describe('restorePriorPayrollCarryConsumed', () => {
  it('restores remaining on prior releases in LIFO order', async () => {
    const tx = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'r2',
            payrollCarryOverAmount: new Decimal(10),
            payrollCarryOverRemaining: new Decimal(0),
          },
          {
            id: 'r1',
            payrollCarryOverAmount: new Decimal(30),
            payrollCarryOverRemaining: new Decimal(10),
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await restorePriorPayrollCarryConsumed(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      restoreAmount: new Decimal(30),
    });

    expect(tx.bonusRelease.update).toHaveBeenCalledTimes(2);
  });
});

describe('reversePayrollCarryAppliedOnSalaryLine', () => {
  it('clears carry applied and reduces bonuses total', async () => {
    const tx = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      salaryLine: { update: vi.fn().mockResolvedValue({}) },
      payrollRun: {},
    };

    await reversePayrollCarryAppliedOnSalaryLine(tx as never, {
      payrollRunId: 'run1',
      payrollMonth: '2026-05',
      employeeId: 'e1',
      line: {
        id: 'sl1',
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(25),
        paidAmount: new Decimal(0),
        payrollCarryAppliedAmount: new Decimal(25),
      },
    });

    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sl1' },
        data: expect.objectContaining({
          bonusesTotal: new Decimal(0),
          payrollCarryAppliedAmount: null,
        }),
      }),
    );
  });
});
