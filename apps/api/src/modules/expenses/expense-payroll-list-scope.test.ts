import { describe, it, expect } from 'vitest';
import type { Prisma } from '@nbos/database';
import { applyPayrollExpenseListScope } from './expense-payroll-list-scope';

describe('applyPayrollExpenseListScope', () => {
  it('restricts to payroll-linked expenses when payrollLinked is true', () => {
    const where: Prisma.ExpenseWhereInput = {};
    applyPayrollExpenseListScope(where, { payrollLinked: true });
    expect(where.salaryLine).toEqual({ isNot: null });
  });

  it('filters by payroll month and employee', () => {
    const where: Prisma.ExpenseWhereInput = {};
    applyPayrollExpenseListScope(where, {
      payrollMonth: '2026-03',
      payrollEmployeeId: 'emp-1',
    });
    expect(where.salaryLine).toEqual({
      is: {
        employeeId: 'emp-1',
        payrollRun: { payrollMonth: '2026-03' },
      },
    });
  });

  it('ignores invalid payroll month', () => {
    const where: Prisma.ExpenseWhereInput = {};
    applyPayrollExpenseListScope(where, { payrollMonth: 'bad' });
    expect(where.salaryLine).toBeUndefined();
  });
});
