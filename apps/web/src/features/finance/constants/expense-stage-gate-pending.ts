import type { ExpenseDetailStageGateHighlight } from './expense-stage-gate-highlight';

const STORAGE_KEY_PREFIX = 'nbos:expense-stage-gate:';

function storageKey(expenseId: string): string {
  return `${STORAGE_KEY_PREFIX}${expenseId}`;
}

export function writeExpenseStageGatePending(
  expenseId: string,
  highlight: ExpenseDetailStageGateHighlight,
): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(storageKey(expenseId), JSON.stringify(highlight));
}

export function readExpenseStageGatePending(
  expenseId: string,
): ExpenseDetailStageGateHighlight | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(storageKey(expenseId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'errors' in parsed &&
      Array.isArray((parsed as ExpenseDetailStageGateHighlight).errors)
    ) {
      return parsed as ExpenseDetailStageGateHighlight;
    }
  } catch {
    return null;
  }
  return null;
}

export function clearExpenseStageGatePending(expenseId: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(storageKey(expenseId));
}
