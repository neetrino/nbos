import { describe, expect, it } from 'vitest';
import type { SalaryBoardRow } from '@/lib/api/payroll-runs';
import {
  formatPayrollMonthAbbrev,
  formatPayrollMonthShort,
  sumSalaryBoardColumn,
  sumSalaryBoardRowsTotal,
} from './salary-board-month-utils';

describe('salary-board-month-utils', () => {
  it('formats month without year', () => {
    expect(formatPayrollMonthShort('2026-04')).toMatch(/april/i);
  });

  it('formats month abbrev', () => {
    expect(formatPayrollMonthAbbrev('2026-04')).toMatch(/apr/i);
  });

  it('sums column payable', () => {
    const total = sumSalaryBoardColumn(
      [
        {
          employee: {
            id: 'e1',
            firstName: 'A',
            lastName: 'B',
            position: null,
            departmentIds: [],
            primaryDepartmentId: null,
          },
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

  it('sums row totals across employees', () => {
    const rows: SalaryBoardRow[] = [
      {
        employee: {
          id: 'e1',
          firstName: 'A',
          lastName: 'B',
          position: null,
          departmentIds: [],
          primaryDepartmentId: null,
        },
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
      {
        employee: {
          id: 'e2',
          firstName: 'C',
          lastName: 'D',
          position: null,
          departmentIds: [],
          primaryDepartmentId: null,
        },
        cells: [
          {
            salaryLineId: 'l2',
            payrollRunId: 'r1',
            payrollMonth: '2026-01',
            runStatus: 'APPROVED',
            lineStatus: 'APPROVED',
            payoutPhase: 'accumulating',
            totalPayable: '50',
            paidAmount: '0',
            remainingAmount: '50',
          },
        ],
      },
    ];
    expect(sumSalaryBoardRowsTotal(rows, 1)).toBe(150);
  });
});
