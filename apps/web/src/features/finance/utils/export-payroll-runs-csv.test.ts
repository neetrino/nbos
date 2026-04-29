import { describe, expect, it } from 'vitest';
import { buildPayrollRunsCsvContent } from './export-payroll-runs-csv';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

const sampleRow: PayrollRunListRow = {
  id: 'run-1',
  payrollMonth: '2026-04',
  status: 'APPROVED',
  totalBaseSalary: '100.00',
  totalBonuses: '0.00',
  totalAdjustments: '0.00',
  totalDeductions: '0.00',
  totalPayable: '100.00',
  totalPaid: '0.00',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  _count: { salaryLines: 5 },
  materializedExpenseLineCount: 3,
};

describe('buildPayrollRunsCsvContent', () => {
  it('includes header and one data row', () => {
    const csv = buildPayrollRunsCsvContent([sampleRow]);
    expect(csv).toContain('payrollMonth');
    expect(csv).toContain('2026-04');
    expect(csv).toContain('run-1');
    expect(csv).toContain('materializedExpenseLineCount');
    expect(csv).toContain('3');
    expect(csv).toContain('totalRemaining');
    const cells = csv.split('\r\n')[1]?.split(',');
    expect(cells?.[9]).toBe('100.00');
    expect(cells?.[10]).toBe('0.00');
    expect(cells?.[11]).toBe('100.00');
  });

  it('returns header only when no rows', () => {
    const csv = buildPayrollRunsCsvContent([]);
    expect(csv).toBe(
      'id,payrollMonth,status,salaryLinesCount,materializedExpenseLineCount,totalBaseSalary,totalBonuses,totalAdjustments,totalDeductions,totalPayable,totalPaid,totalRemaining,createdAt,updatedAt',
    );
  });

  it('derives negative totalRemaining when paid exceeds payable', () => {
    const row: PayrollRunListRow = {
      ...sampleRow,
      id: 'run-2',
      totalPayable: '10.00',
      totalPaid: '25.00',
    };
    const csv = buildPayrollRunsCsvContent([row]);
    const cells = csv.split('\r\n')[1]?.split(',');
    expect(cells?.[9]).toBe('10.00');
    expect(cells?.[10]).toBe('25.00');
    expect(cells?.[11]).toBe('-15.00');
  });
});
