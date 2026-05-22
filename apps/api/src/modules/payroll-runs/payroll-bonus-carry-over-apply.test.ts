import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import { applyPendingPayrollCarryOver } from './payroll-bonus-carry-over-apply';
import { defaultBonusCapBaseSalaryMultiplier } from './parse-bonus-cap-multiplier';

describe('applyPendingPayrollCarryOver', () => {
  it('returns zero when no pending carry', async () => {
    const tx = {
      bonusRelease: { findMany: vi.fn().mockResolvedValue([]) },
      salaryLine: { update: vi.fn() },
    };
    const applied = await applyPendingPayrollCarryOver(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      line: {
        id: 'sl1',
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(0),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        paidAmount: new Decimal(0),
      },
      bonusCapBaseSalaryMultiplier: defaultBonusCapBaseSalaryMultiplier(),
    });
    expect(applied.toString()).toBe('0');
  });

  it('applies carry FIFO up to cap room and updates salary line', async () => {
    const tx = {
      bonusRelease: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 'r1', payrollCarryOverRemaining: new Decimal(30) }]),
        update: vi.fn().mockResolvedValue({}),
      },
      salaryLine: { update: vi.fn().mockResolvedValue({}) },
    };
    const applied = await applyPendingPayrollCarryOver(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      line: {
        id: 'sl1',
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(150),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        paidAmount: new Decimal(0),
      },
      bonusCapBaseSalaryMultiplier: defaultBonusCapBaseSalaryMultiplier(),
    });
    expect(applied.toString()).toBe('30');
    expect(tx.bonusRelease.update).toHaveBeenCalled();
    expect(tx.salaryLine.update).toHaveBeenCalledTimes(2);
    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { payrollCarryAppliedAmount: new Decimal(30) },
      }),
    );
  });
});
