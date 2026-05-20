export const EXPENSE_TYPES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'UNPLANNED', label: 'Unplanned' },
] as const;

export const EXPENSE_FREQUENCIES = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'MULTI_YEAR', label: 'Multi-year' },
] as const;

export const TAX_STATUSES = [
  { value: 'TAX', label: 'Tax' },
  { value: 'TAX_FREE', label: 'Tax-free' },
] as const;

/** Matches NBOS Expense Backlog reasons (`docs/NBOS/02-Modules/04-Finance/04-Expenses.md`). */
export const EXPENSE_BACKLOG_REASONS = [
  { value: 'DEBT_PAY_LATER', label: 'Debt to pay later' },
  { value: 'WAITING_DECISION', label: 'Waiting for decision' },
  { value: 'WAITING_CLIENT', label: 'Waiting for client' },
  { value: 'WAITING_PROVIDER', label: 'Waiting for provider' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function formatExpenseBacklogReasonLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const row = EXPENSE_BACKLOG_REASONS.find((r) => r.value === value);
  return row?.label ?? value;
}

export const PROJECTS_PAGE_SIZE = 150;

export const SCHEMA_EXPENSE_STATUSES = new Set([
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
  'ON_HOLD',
  'BACKLOG',
  'PAID',
]);

export function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
