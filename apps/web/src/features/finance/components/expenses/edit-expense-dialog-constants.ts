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

/** Fixed width for compact expense sheet fields (amount, category). */
export const EXPENSE_COMPACT_FIELD_WIDTH_CLASS = 'w-[10rem] shrink-0';

/** Due date field width in expense detail sheet. */
export const EXPENSE_DUE_DATE_FIELD_WIDTH_CLASS = 'w-[8.5rem] shrink-0';

/** Equal-width rows in expense detail General — fields stretch edge-to-edge. */
export const EXPENSE_SHEET_FIELD_ROW_3_CLASS = 'grid grid-cols-3 gap-3';

export const EXPENSE_SHEET_FIELD_ROW_2_CLASS = 'grid grid-cols-2 gap-3';

export const EXPENSE_SHEET_FIELD_CELL_CLASS = 'min-w-0 w-full';

export const EXPENSE_STATUS_SEGMENTED_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'DUE_SOON', label: 'Soon' },
  { value: 'DUE_NOW', label: 'Now' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'ON_HOLD', label: 'Hold' },
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'PAID', label: 'Paid' },
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
