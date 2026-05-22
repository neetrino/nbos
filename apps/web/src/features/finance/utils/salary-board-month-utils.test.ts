import { describe, expect, it } from 'vitest';
import {
  formatPayrollMonthShort,
  payrollMonthYear,
  sumSalaryBoardColumn,
} from './salary-board-month-utils';

describe('salary-board-month-utils', () => {
  it('formats month without year', () => {
    expect(formatPayrollMonthShort('2026-04')).toMatch(/april/i);
  });

  it('parses year from payroll month', () => {
    expect(payrollMonthYear('2026-04')).toBe(2026);
  });

  it('sums column payable', () => {
    const total = sumSalaryBoardColumn(
      [
        {
          employee: { id: 'e1', firstName: 'A', lastName: 'B', position: null },
          cells: [
            {
              salaryLineId: 'l1',
              payrollRunId: 'r1',
              payrollMonth: '2026-01',
              runStatus: 'APPROVED',
              lineStatus: 'APPROVED',
              payoutPhase: 'accumulating',
              totalPayable: '100',
              paidAmount: '0',
              remainingAmount: '100',
            },
          ],
        },
      ],
      0,
    );
    expect(total).toBe(100);
  });
});
