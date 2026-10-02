import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  endOfPayrollMonthUtc,
  formatPayrollExpenseNotes,
  pickPayrollExpenseCategory,
  materializePayrollExpensesForApprovedRun,
} from './payroll-materialize-expenses';

function payableLine(params: {
  id: string;
  currency: string | null;
  totalPayable?: string;
  baseSalary?: string;
  bonusesTotal?: string;
}): Record<string, unknown> {
  const hasProfile = params.currency != null;
  return {
    id: params.id,
    payrollRunId: 'run-1',
    expenseId: null,
    compensationProfileId: hasProfile ? `cp-${params.id}` : null,
    totalPayable: new Decimal(params.totalPayable ?? '120000'),
    baseSalary: new Decimal(params.baseSalary ?? '100000'),
    bonusesTotal: new Decimal(params.bonusesTotal ?? '20000'),
    employee: { firstName: 'Ada', lastName: 'Lovelace' },
    compensationProfile: hasProfile ? { id: `cp-${params.id}`, currency: params.currency } : null,
  };
}

function octoberSettlementLine(): Record<string, unknown> {
  return {
    id: 'sl-settle',
    payrollRunId: 'pr-oct',
    expenseId: null,
    compensationProfileId: null,
    totalPayable: new Decimal('40000.00'),
    baseSalary: new Decimal('0.00'),
    bonusesTotal: new Decimal('40000.00'),
    employee: { firstName: 'Ada', lastName: 'Lovelace' },
    compensationProfile: null,
  };
}

function materializeTx(lines: unknown[]) {
  const expenseCreate = vi.fn().mockResolvedValue({ id: 'exp-1' });
  const salaryLineUpdate = vi.fn().mockResolvedValue({});
  return {
    expenseCreate,
    salaryLineUpdate,
    tx: {
      salaryLine: { findMany: vi.fn().mockResolvedValue(lines), update: salaryLineUpdate },
      expense: { create: expenseCreate },
    },
  };
}

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
    expect(formatPayrollExpenseNotes('run-1', 'line-2', 'cp-9')).toContain(
      'compensationProfileId=cp-9',
    );
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
  it('creates one unlabeled AMD expense for an AMD payable line', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({ id: 'line-1', currency: 'AMD' }),
    ]);

    const result = await materializePayrollExpensesForApprovedRun(tx as never, {
      payrollRunId: 'run-1',
      payrollMonth: '2026-04',
    });

    expect(result.createdExpenseIds).toEqual(['exp-1']);
    expect(expenseCreate).toHaveBeenCalledTimes(1);
    const created = expenseCreate.mock.calls[0][0].data as Record<string, unknown>;
    expect(created.amount).toEqual(new Decimal('120000'));
    expect(created).not.toHaveProperty('currency');
    expect(created.name).toContain('2026-04');
    expect(created.name).toContain('Ada');
    expect(created.status).toBe('DUE_NOW');
    expect(salaryLineUpdate).toHaveBeenCalledWith({
      where: { id: 'line-1' },
      data: { expenseId: 'exp-1', status: 'APPROVED' },
    });
  });

  it('rejects a USD profile and creates no expense', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({ id: 'line-usd', currency: 'USD', totalPayable: '1000' }),
    ]);

    await expect(
      materializePayrollExpensesForApprovedRun(tx as never, {
        payrollRunId: 'run-1',
        payrollMonth: '2026-04',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(expenseCreate).not.toHaveBeenCalled();
    expect(salaryLineUpdate).not.toHaveBeenCalled();
  });

  it('rejects a EUR profile and creates no expense', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({ id: 'line-eur', currency: 'EUR' }),
    ]);

    await expect(
      materializePayrollExpensesForApprovedRun(tx as never, {
        payrollRunId: 'run-1',
        payrollMonth: '2026-04',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(expenseCreate).not.toHaveBeenCalled();
    expect(salaryLineUpdate).not.toHaveBeenCalled();
  });

  it('rejects mixed AMD and USD lines before creating any expense', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({ id: 'line-amd', currency: 'AMD' }),
      payableLine({ id: 'line-usd', currency: 'USD' }),
    ]);

    await expect(
      materializePayrollExpensesForApprovedRun(tx as never, {
        payrollRunId: 'run-1',
        payrollMonth: '2026-04',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(expenseCreate).not.toHaveBeenCalled();
    expect(salaryLineUpdate).not.toHaveBeenCalled();
  });

  it('creates one 40000 BONUS expense for a post-fire settlement line with no profile', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([octoberSettlementLine()]);

    const result = await materializePayrollExpensesForApprovedRun(tx as never, {
      payrollRunId: 'pr-oct',
      payrollMonth: '2026-10',
    });

    expect(result.createdExpenseIds).toEqual(['exp-1']);
    expect(expenseCreate).toHaveBeenCalledTimes(1);
    const created = expenseCreate.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(created.amount).toEqual(new Decimal('40000.00'));
    expect(created.category).toBe('BONUS');
    expect(created).not.toHaveProperty('currency');
    expect(salaryLineUpdate).toHaveBeenCalledWith({
      where: { id: 'sl-settle' },
      data: { expenseId: 'exp-1', status: 'APPROVED' },
    });
    expect(salaryLineUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ baseSalary: expect.anything() }),
      }),
    );
  });

  it('rejects a blank profile currency on an ordinary salary line', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({ id: 'line-blank', currency: '' }),
    ]);

    await expect(
      materializePayrollExpensesForApprovedRun(tx as never, {
        payrollRunId: 'run-1',
        payrollMonth: '2026-10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(expenseCreate).not.toHaveBeenCalled();
    expect(salaryLineUpdate).not.toHaveBeenCalled();
  });

  it('rejects a missing profile on an ordinary salary line with a real base salary', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({ id: 'line-no-profile', currency: null, baseSalary: '300000' }),
    ]);

    await expect(
      materializePayrollExpensesForApprovedRun(tx as never, {
        payrollRunId: 'run-1',
        payrollMonth: '2026-10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(expenseCreate).not.toHaveBeenCalled();
    expect(salaryLineUpdate).not.toHaveBeenCalled();
  });

  it('rejects a zero-salary line that still has a USD profile', async () => {
    const { tx, expenseCreate, salaryLineUpdate } = materializeTx([
      payableLine({
        id: 'line-usd-zero',
        currency: 'USD',
        baseSalary: '0',
        bonusesTotal: '40000',
        totalPayable: '40000',
      }),
    ]);

    await expect(
      materializePayrollExpensesForApprovedRun(tx as never, {
        payrollRunId: 'run-1',
        payrollMonth: '2026-10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(expenseCreate).not.toHaveBeenCalled();
    expect(salaryLineUpdate).not.toHaveBeenCalled();
  });

  it('skips non-positive payable lines', async () => {
    const { tx, expenseCreate } = materializeTx([
      {
        id: 'line-0',
        payrollRunId: 'run-1',
        expenseId: null,
        totalPayable: new Decimal(0),
        baseSalary: new Decimal(0),
        bonusesTotal: new Decimal(0),
        employee: { firstName: 'X', lastName: 'Y' },
        compensationProfile: { id: 'cp-0', currency: 'USD' },
      },
    ]);

    const result = await materializePayrollExpensesForApprovedRun(tx as never, {
      payrollRunId: 'run-1',
      payrollMonth: '2026-05',
    });

    expect(result.createdExpenseIds).toEqual([]);
    expect(expenseCreate).not.toHaveBeenCalled();
  });
});
