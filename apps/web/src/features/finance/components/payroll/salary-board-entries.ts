import type {
  CompensationPayoutPhase,
  SalaryBoardCell,
  SalaryBoardResponse,
  SalaryLineStatus,
} from '@/lib/api/payroll-runs';

export interface SalaryBoardEntry {
  salaryLineId: string;
  payrollMonth: string;
  employee: SalaryBoardResponse['rows'][number]['employee'];
  cell: SalaryBoardCell;
}

export function flattenSalaryBoard(data: SalaryBoardResponse): SalaryBoardEntry[] {
  const entries: SalaryBoardEntry[] = [];
  for (const row of data.rows) {
    row.cells.forEach((cell, idx) => {
      if (!cell) return;
      entries.push({
        salaryLineId: cell.salaryLineId,
        payrollMonth: data.months[idx] ?? cell.payrollMonth,
        employee: row.employee,
        cell,
      });
    });
  }
  return entries;
}

export function employeeDisplayName(emp: SalaryBoardEntry['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export interface SalaryBoardClientFilters {
  search: string;
  employeeId: string;
  lineStatus: string;
  payoutPhase: string;
}

export function filterSalaryBoardEntries(
  entries: SalaryBoardEntry[],
  filters: SalaryBoardClientFilters,
): SalaryBoardEntry[] {
  const q = filters.search.trim().toLowerCase();
  return entries.filter((entry) => {
    const name = employeeDisplayName(entry.employee).toLowerCase();
    const position = entry.employee.position?.toLowerCase() ?? '';
    const matchesSearch = !q || name.includes(q) || position.includes(q);
    const matchesEmployee =
      filters.employeeId === 'all' || entry.employee.id === filters.employeeId;
    const matchesStatus =
      filters.lineStatus === 'all' || entry.cell.lineStatus === filters.lineStatus;
    const matchesPhase =
      filters.payoutPhase === 'all' || entry.cell.payoutPhase === filters.payoutPhase;
    return matchesSearch && matchesEmployee && matchesStatus && matchesPhase;
  });
}

export function filterSalaryBoardRows(
  data: SalaryBoardResponse,
  filters: SalaryBoardClientFilters,
): SalaryBoardResponse['rows'] {
  const allowedLineIds = new Set(
    filterSalaryBoardEntries(flattenSalaryBoard(data), filters).map((e) => e.salaryLineId),
  );
  return data.rows
    .filter((row) => {
      if (filters.employeeId !== 'all' && row.employee.id !== filters.employeeId) {
        return false;
      }
      if (filters.search.trim()) {
        const name = employeeDisplayName(row.employee).toLowerCase();
        const q = filters.search.trim().toLowerCase();
        if (!name.includes(q) && !(row.employee.position?.toLowerCase().includes(q) ?? false)) {
          return false;
        }
      }
      return row.cells.some((c) => c && allowedLineIds.has(c.salaryLineId));
    })
    .map((row) => ({
      ...row,
      cells: row.cells.map((cell) => (cell && allowedLineIds.has(cell.salaryLineId) ? cell : null)),
    }));
}

export const SALARY_BOARD_PAYOUT_PHASE_ORDER: readonly CompensationPayoutPhase[] = [
  'active_payout',
  'accumulating',
  'past_paid',
] as const;

export const SALARY_LINE_STATUS_FILTER_OPTIONS: Array<{
  value: SalaryLineStatus | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'HELD', label: 'Held' },
];
