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
