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

export const PROJECTS_PAGE_SIZE = 150;

export const SCHEMA_EXPENSE_STATUSES = new Set([
  'THIS_MONTH',
  'PAY_NOW',
  'DELAYED',
  'ON_HOLD',
  'PAID',
  'UNPAID',
]);

export function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
