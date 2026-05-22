import { describe, expect, it } from 'vitest';
import { buildPayrollSalaryLinesCsvContent } from './export-payroll-salary-lines-csv';
import type { SalaryLineRow } from '@/lib/api/payroll-runs';

const sampleLine: SalaryLineRow = {
  id: 'sl-1',
  payrollRunId: 'run-1',
  employeeId: 'emp-1',
  baseSalary: '1000.00',
  bonusesTotal: '50.00',
  adjustmentsTotal: '0.00',
  deductionsTotal: '100.00',
  totalPayable: '950.00',
  paidAmount: '200.00',
  remainingAmount: '750.00',
  status: 'APPROVED',
  expenseId: 'exp-1',
  kpiSalesPlanAmount: null,
  kpiSalesActualAmount: null,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  employee: { id: 'emp-1', firstName: 'Ann', lastName: 'Smith', email: 'a@x.test' },
  expense: { id: 'exp-1', name: 'Salary Apr', amount: '950.00', status: 'PLANNED' },
};

describe('buildPayrollSalaryLinesCsvContent', () => {
  it('includes header and one row with employee and expense', () => {
    const csv = buildPayrollSalaryLinesCsvContent([sampleLine], '2026-04');
    expect(csv).toContain('salaryLineId');
    expect(csv).toContain('sl-1');
    expect(csv).toContain('Ann Smith');
    expect(csv).toContain('Salary Apr');
    expect(csv).toContain('950.00');
  });

  it('returns header only when no rows', () => {
    const csv = buildPayrollSalaryLinesCsvContent([], '2026-04');
    expect(csv).toBe(
      'payrollRunId,payrollMonth,salaryLineId,employeeId,employeeName,baseSalary,bonusesTotal,adjustmentsTotal,deductionsTotal,totalPayable,paidAmount,remainingAmount,lineStatus,expenseId,expenseName,createdAt,updatedAt',
    );
  });
});
