import { describe, it, expect, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  endOfPayrollMonthUtc,
  formatPayrollExpenseNotes,
  pickPayrollExpenseCategory,
  materializePayrollExpensesForApprovedRun,
} from './payroll-materialize-expenses';

describe('payroll-materialize-expenses helpers', () => {
  it('endOfPayrollMonthUtc returns last UTC day of month', () => {
    const d = endOfPayrollMonthUtc('2026-03');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(2);
    expect(d.getUTCDate()).toBe(31);
  });

  it('formatPayrollExpenseNotes encodes ids', () => {
    expect(formatPayrollExpenseNotes('run-1', 'line-2')).toContain('run-1');
    expect(formatPayrollExpenseNotes('run-1', 'line-2')).toContain('line-2');
  });

  it('pickPayrollExpenseCategory prefers BONUS when only bonus', () => {
    expect(
      pickPayrollExpenseCategory({
        baseSalary: new Decimal(0),
        bonusesTotal: new Decimal(100),
      }),
    ).toBe('BONUS');
  });

  it('pickPayrollExpenseCategory uses SALARY for base-only', () => {
    expect(
      pickPayrollExpenseCategory({
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(0),
      }),
    ).toBe('SALARY');
  });

  it('pickPayrollExpenseCategory uses SALARY for mixed base + bonus', () => {
    expect(
      pickPayrollExpenseCategory({
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(50),
      }),
    ).toBe('SALARY');
  });
});

describe('materializePayrollExpensesForApprovedRun', () => {
  it('creates expense and links salary line', async () => {
    const line = {
      id: 'line-1',
      payrollRunId: 'run-1',
      expenseId: null,
      totalPayable: new Decimal('120000'),
      baseSalary: new Decimal('100000'),
      bonusesTotal: new Decimal('20000'),
      employee: { firstName: 'Ada', lastName: 'Lovelace' },
    };

    const expenseCreate = vi.fn().mockResolvedValue({ id: 'exp-1' });
    const salaryLineUpdate = vi.fn().mockResolvedValue({});
    const salaryLineFindMany = vi.fn().mockResolvedValue([line]);

    const tx = {
      salaryLine: { findMany: salaryLineFindMany, update: salaryLineUpdate },
      expense: { create: expenseCreate },
    };

    const result = await materializePayrollExpensesForApprovedRun(tx as never, {
      payrollRunId: 'run-1',
      payrollMonth: '2026-04',
    });

    expect(result.createdExpenseIds).toEqual(['exp-1']);
    expect(expenseCreate).toHaveBeenCalledTimes(1);
    expect(expenseCreate.mock.calls[0][0].data.name).toContain('2026-04');
    expect(expenseCreate.mock.calls[0][0].data.name).toContain('Ada');
    expect(expenseCreate.mock.calls[0][0].data.status).toBe('DUE_NOW');
    expect(salaryLineUpdate).toHaveBeenCalledWith({
      where: { id: 'line-1' },
      data: { expenseId: 'exp-1', status: 'APPROVED' },
    });
  });

  it('skips non-positive payable lines', async () => {
    const salaryLineFindMany = vi.fn().mockResolvedValue([
      {
        id: 'line-0',
        payrollRunId: 'run-1',
        expenseId: null,
        totalPayable: new Decimal(0),
        baseSalary: new Decimal(0),
        bonusesTotal: new Decimal(0),
        employee: { firstName: 'X', lastName: 'Y' },
      },
    ]);
    const expenseCreate = vi.fn();
    const tx = {
      salaryLine: { findMany: salaryLineFindMany, update: vi.fn() },
      expense: { create: expenseCreate },
    };

    const result = await materializePayrollExpensesForApprovedRun(tx as never, {
      payrollRunId: 'run-1',
      payrollMonth: '2026-05',
    });

    expect(result.createdExpenseIds).toEqual([]);
    expect(expenseCreate).not.toHaveBeenCalled();
  });
});
