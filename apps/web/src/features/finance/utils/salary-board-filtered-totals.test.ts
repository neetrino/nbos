import { describe, expect, it } from 'vitest';
import { computeSalaryBoardFilteredTotals } from './salary-board-filtered-totals';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';

function entry(payable: string, paid: string, remaining: string): SalaryBoardEntry {
  return {
    salaryLineId: 'line-1',
    payrollMonth: '2026-04',
    employee: { id: 'e1', firstName: 'A', lastName: 'B', position: null },
    cell: {
      salaryLineId: 'line-1',
      payrollRunId: 'run-1',
      payrollMonth: '2026-04',
      runStatus: 'APPROVED',
      lineStatus: 'PARTIALLY_PAID',
      payoutPhase: 'active_payout',
      totalPayable: payable,
      paidAmount: paid,
      remainingAmount: remaining,
    },
  };
}

describe('computeSalaryBoardFilteredTotals', () => {
  it('sums payable, paid, and remaining across visible lines', () => {
    const totals = computeSalaryBoardFilteredTotals([
      entry('1000', '400', '600'),
      entry('500', '500', '0'),
    ]);
    expect(totals).toEqual({
      lineCount: 2,
      payable: 1500,
      paid: 900,
      remaining: 600,
    });
  });
});
