/**
 * Matches NBOS payroll materialization trace in expense `notes`
 * (see `formatPayrollExpenseNotes` in API `payroll-materialize-expenses`).
 */
const PAYROLL_EXPENSE_NOTE_REGEX = /NBOS\s+payrollRunId=([^;\s]+);\s*salaryLineId=([^\s]+)/;

export interface ParsedPayrollExpenseNote {
  payrollRunId: string;
  salaryLineId: string;
}

export function parsePayrollLinkFromExpenseNotes(
  notes: string | null | undefined,
): ParsedPayrollExpenseNote | null {
  if (!notes?.trim()) return null;
  const m = PAYROLL_EXPENSE_NOTE_REGEX.exec(notes);
  if (!m) return null;
  const payrollRunId = m[1]?.trim();
  const salaryLineId = m[2]?.trim();
  if (!payrollRunId || !salaryLineId) return null;
  return { payrollRunId, salaryLineId };
}

/** Minimal shape for list/detail/CSV: API link first, then NBOS notes marker. */
export type ExpensePayrollLinkSource = {
  linkedPayrollRun?: { payrollRunId: string; payrollMonth?: string } | null;
  notes: string | null;
};

export function resolveExpensePayrollRunId(expense: ExpensePayrollLinkSource): string | null {
  const fromApi = expense.linkedPayrollRun?.payrollRunId?.trim();
  if (fromApi) return fromApi;
  return parsePayrollLinkFromExpenseNotes(expense.notes)?.payrollRunId ?? null;
}

export function resolveExpensePayrollMonthLabel(expense: ExpensePayrollLinkSource): string | null {
  const month = expense.linkedPayrollRun?.payrollMonth?.trim();
  return month || null;
}

export function resolveExpenseSalaryLineId(
  expense: ExpensePayrollLinkSource & { linkedPayrollRun?: { salaryLineId?: string } | null },
): string | null {
  const fromApi = expense.linkedPayrollRun?.salaryLineId?.trim();
  if (fromApi) return fromApi;
  return parsePayrollLinkFromExpenseNotes(expense.notes)?.salaryLineId ?? null;
}
