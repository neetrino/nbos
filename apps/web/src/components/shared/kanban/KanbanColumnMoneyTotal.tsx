'use client';

import { formatMoneyDram } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import type { KanbanColumn } from './kanban.types';
import { sumKanbanColumnMoney } from './sum-kanban-column-money';

interface KanbanColumnMoneyTotalProps<T> {
  column: KanbanColumn<T>;
  getAmount: (item: T) => number | string | null | undefined;
}

/** Bitrix-style centered pill under the stage chevron (financial kanban boards). */
export function KanbanColumnMoneyTotal<T>({ column, getAmount }: KanbanColumnMoneyTotalProps<T>) {
  const total = sumKanbanColumnMoney(column.items, getAmount);

  return (
    <div className="flex justify-center px-1">
      <p
        className={cn(
          'max-w-full rounded-full border px-3 py-1 text-center text-sm leading-tight font-semibold tabular-nums',
          'text-foreground/85 border-white/30 bg-white/25 shadow-sm backdrop-blur-md',
          'dark:text-foreground/90 dark:border-white/10 dark:bg-white/8',
        )}
        aria-label={`Column total: ${formatMoneyDram(total)}`}
      >
        {formatMoneyDram(total)}
      </p>
    </div>
  );
}
