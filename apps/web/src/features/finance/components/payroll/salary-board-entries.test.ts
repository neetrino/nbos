import { describe, expect, it } from 'vitest';
import { filterSalaryBoardEntries } from './salary-board-entries';
import type { SalaryBoardEntry } from './salary-board-entries';

const entry = (employeeId: string, departmentIds: string[]): SalaryBoardEntry => ({
  salaryLineId: `${employeeId}-sl`,
  payrollMonth: '2026-04',
  employee: {
    id: employeeId,
    firstName: 'A',
    lastName: 'B',
    position: null,
    departmentIds,
    primaryDepartmentId: departmentIds[0] ?? null,
  },
  cell: {
    salaryLineId: `${employeeId}-sl`,
    payrollRunId: 'r1',
    payrollMonth: '2026-04',
    runStatus: 'DRAFT',
    lineStatus: 'PENDING',
    payoutPhase: 'accumulating',
    totalPayable: '100',
    paidAmount: '0',
    remainingAmount: '100',
  },
});

describe('filterSalaryBoardEntries department', () => {
  it('filters by department membership', () => {
    const rows = [entry('e1', ['d-sales']), entry('e2', ['d-ops'])];
    const filtered = filterSalaryBoardEntries(rows, {
      search: '',
      employeeId: 'all',
      departmentId: 'd-sales',
      lineStatus: 'all',
      payoutPhase: 'all',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.employee.id).toBe('e1');
  });
});
