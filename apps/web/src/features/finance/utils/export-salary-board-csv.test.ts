import { describe, expect, it } from 'vitest';
import { buildSalaryBoardCsvContent } from './export-salary-board-csv';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';

const entry: SalaryBoardEntry = {
  salaryLineId: 'sl-1',
  payrollMonth: '2026-04',
  employee: { id: 'e1', firstName: 'Ann', lastName: 'Lee', position: null },
  cell: {
    salaryLineId: 'sl-1',
    payrollRunId: 'pr-1',
    payrollMonth: '2026-04',
    runStatus: 'APPROVED',
    lineStatus: 'PARTIALLY_PAID',
    payoutPhase: 'active_payout',
    totalPayable: '1000',
    paidAmount: '400',
    remainingAmount: '600',
  },
};

describe('buildSalaryBoardCsvContent', () => {
  it('includes header and row', () => {
    const csv = buildSalaryBoardCsvContent([entry]);
    expect(csv).toContain('salaryLineId');
    expect(csv).toContain('Ann Lee');
    expect(csv).toContain('active_payout');
  });
});
