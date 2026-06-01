'use client';

import { formatMoneyDram } from '@/lib/format/money';
import { cn } from '@/lib/utils';

interface KanbanColumnMoneyPillProps {
  total: number | string;
}

/** Centered money pill for kanban column headers (aggregate or summed total). */
export function KanbanColumnMoneyPill({ total }: KanbanColumnMoneyPillProps) {
  const formatted = formatMoneyDram(typeof total === 'string' ? Number(total) : total);

  return (
    <div className="flex justify-center px-1">
      <p
        className={cn(
          'max-w-full rounded-full border px-3 py-1 text-center text-sm leading-tight font-semibold tabular-nums',
          'text-foreground/85 border-white/30 bg-white/25 shadow-sm backdrop-blur-md',
          'dark:text-foreground/90 dark:border-white/10 dark:bg-white/8',
        )}
        aria-label={`Column total: ${formatted}`}
      >
        {formatted}
      </p>
    </div>
  );
}
