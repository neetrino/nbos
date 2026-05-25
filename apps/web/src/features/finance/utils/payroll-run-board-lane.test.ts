import { describe, expect, it } from 'vitest';
import { groupPayrollRunsByBoardLane } from './payroll-run-board-lane';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

const run = (month: string, status: PayrollRunListRow['status']): PayrollRunListRow => ({
  id: `${month}-${status}`,
  payrollMonth: month,
  status,
  totalBaseSalary: '0',
  totalBonuses: '0',
  totalAdjustments: '0',
  totalDeductions: '0',
  totalPayable: '1000',
  totalPaid: '0',
  kpiSalesPlanAmount: null,
  kpiSalesActualAmount: null,
  createdAt: '',
  updatedAt: '',
  _count: { salaryLines: 1 },
  materializedExpenseLineCount: 0,
});

describe('groupPayrollRunsByBoardLane', () => {
  it('sorts each lane by payroll month descending', () => {
    const lanes = groupPayrollRunsByBoardLane([
      run('2024-01', 'DRAFT'),
      run('2024-03', 'DRAFT'),
      run('2024-02', 'REVIEW'),
    ]);
    expect(lanes.DRAFT.map((r) => r.payrollMonth)).toEqual(['2024-03', '2024-01']);
    expect(lanes.REVIEW).toHaveLength(1);
    expect(lanes.CLOSED).toHaveLength(0);
  });
});
