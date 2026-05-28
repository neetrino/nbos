import { describe, expect, it } from 'vitest';
import { buildPayrollRunsCalendarModel, payrollMonthKey } from './payroll-runs-calendar-utils';

describe('payroll-runs-calendar-utils', () => {
  it('indexes runs by YYYY-MM and sorts years descending', () => {
    const model = buildPayrollRunsCalendarModel([
      {
        id: 'r1',
        payrollMonth: '2025-03',
        status: 'APPROVED',
        totalBaseSalary: '0',
        totalBonuses: '0',
        totalAdjustments: '0',
        totalDeductions: '0',
        totalPayable: '100',
        totalPaid: '0',
        createdAt: '',
        updatedAt: '',
        _count: { salaryLines: 1 },
        materializedExpenseLineCount: 1,
      },
      {
        id: 'r2',
        payrollMonth: '2026-01',
        status: 'DRAFT',
        totalBaseSalary: '0',
        totalBonuses: '0',
        totalAdjustments: '0',
        totalDeductions: '0',
        totalPayable: '50',
        totalPaid: '0',
        createdAt: '',
        updatedAt: '',
        _count: { salaryLines: 2 },
        materializedExpenseLineCount: 0,
      },
    ]);

    expect(model.years[0]).toBeGreaterThanOrEqual(2026);
    expect(model.runsByMonthKey.get(payrollMonthKey(2025, 3))?.id).toBe('r1');
    expect(model.runsByMonthKey.get(payrollMonthKey(2026, 1))?.id).toBe('r2');
  });
});
