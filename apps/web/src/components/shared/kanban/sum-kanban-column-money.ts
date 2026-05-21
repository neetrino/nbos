import { parseMoneyAmount } from '@/lib/format/money';

/** Sums numeric amounts for kanban column roll-ups. */
export function sumKanbanColumnMoney<T>(
  items: T[],
  getAmount: (item: T) => number | string | null | undefined,
): number {
  return items.reduce((sum, item) => sum + parseMoneyAmount(getAmount(item)), 0);
}
