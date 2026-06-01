'use client';

import type { KanbanColumn } from './kanban.types';
import { KanbanColumnMoneyPill } from './KanbanColumnMoneyPill';
import { sumKanbanColumnMoney } from './sum-kanban-column-money';

interface KanbanColumnMoneyTotalProps<T> {
  column: KanbanColumn<T>;
  getAmount: (item: T) => number | string | null | undefined;
}

/** Bitrix-style centered pill under the stage chevron (financial kanban boards). */
export function KanbanColumnMoneyTotal<T>({ column, getAmount }: KanbanColumnMoneyTotalProps<T>) {
  const total = sumKanbanColumnMoney(column.items, getAmount);
  return <KanbanColumnMoneyPill total={total} />;
}
