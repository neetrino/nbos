/** Upper bound for `GET /expenses` `pageSize` to limit accidental huge reads. */
export const EXPENSE_LIST_MAX_PAGE_SIZE = 500;

const DEFAULT_PAGE_SIZE = 20;

export function normalizeExpenseListPage(raw?: number): number {
  if (raw === undefined || raw === null || Number.isNaN(raw)) {
    return 1;
  }
  const n = Math.floor(raw);
  return n >= 1 ? n : 1;
}

export function normalizeExpenseListPageSize(raw?: number): number {
  if (raw === undefined || raw === null || Number.isNaN(raw)) {
    return DEFAULT_PAGE_SIZE;
  }
  const n = Math.floor(raw);
  if (n < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(n, EXPENSE_LIST_MAX_PAGE_SIZE);
}
