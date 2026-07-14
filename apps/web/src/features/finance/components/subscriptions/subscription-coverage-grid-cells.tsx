'use client';

import { formatAmount, formatAmountAbbreviated } from '@/features/finance/constants/finance';
import type { SubscriptionGridCell, SubscriptionGridCellKind } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

/** Compact month card height for the subscription grid. */
export const SUBSCRIPTION_CALENDAR_SLOT_CLASS = 'h-12 w-full';

const MONTH_CELL_BLOCK_CLASS =
  'flex w-full flex-col items-center justify-center gap-0 overflow-hidden rounded-md border px-0.5 py-0.5 text-center transition-colors';

function cellVisualClasses(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'border-green-200/80 bg-green-100 text-green-900 hover:bg-green-200/70 dark:border-green-800/50 dark:bg-green-900/35 dark:text-green-200 dark:hover:bg-green-900/50';
    case 'PENDING_INVOICE':
      return 'border-amber-200/80 bg-amber-100 text-amber-900 hover:bg-amber-200/70 dark:border-amber-800/50 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/50';
    case 'OVERDUE_INVOICE':
      return 'border-red-200/80 bg-red-100 text-red-900 hover:bg-red-200/70 dark:border-red-800/50 dark:bg-red-900/35 dark:text-red-200 dark:hover:bg-red-900/50';
    case 'FORECAST':
      return 'border-blue-200/80 bg-blue-100 text-blue-900 hover:bg-blue-200/70 dark:border-blue-800/50 dark:bg-blue-900/35 dark:text-blue-200 dark:hover:bg-blue-900/50';
    case 'SUBSCRIPTION_PENDING':
      return 'border-violet-200/80 bg-violet-100 text-violet-900 hover:bg-violet-200/70 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/50';
    case 'MISSED':
      return 'border-zinc-300/80 bg-muted/40 text-zinc-800 hover:bg-muted/60 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700';
    default:
      return 'border-border bg-muted/20 text-muted-foreground';
  }
}

function cellStatusLabel(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'Paid';
    case 'PENDING_INVOICE':
      return 'Invoice';
    case 'OVERDUE_INVOICE':
      return 'Overdue';
    case 'FORECAST':
      return 'Forecast';
    case 'SUBSCRIPTION_PENDING':
      return 'Pending';
    case 'MISSED':
      return 'Missed';
    default:
      return '';
  }
}

/** Sidebar collapsed (wide layout) → full amount; sidebar open → `150K`. */
export function formatSubscriptionGridAmount(amount: number, sidebarCollapsed: boolean): string {
  return sidebarCollapsed ? formatAmount(amount) : formatAmountAbbreviated(amount);
}

export function SubscriptionCompactAmount({
  value,
  sidebarCollapsed,
}: {
  value: number;
  sidebarCollapsed: boolean;
}) {
  const fullAmount = formatAmount(value);
  const isCompact = !sidebarCollapsed;
  return (
    <span
      className="block max-w-full truncate tabular-nums"
      title={isCompact ? fullAmount : undefined}
    >
      {formatSubscriptionGridAmount(value, sidebarCollapsed)}
    </span>
  );
}

export function SubscriptionEmptyMonthCell() {
  return (
    <div
      className={cn(
        'border-border text-muted-foreground dark:bg-card flex items-center justify-center rounded-md border border-dashed bg-white text-xs',
        SUBSCRIPTION_CALENDAR_SLOT_CLASS,
      )}
      aria-hidden
    >
      —
    </div>
  );
}

export function SubscriptionGridMonthCell({
  cell,
  amountMonthly,
  sidebarCollapsed,
  onOpen,
}: {
  cell: SubscriptionGridCell;
  amountMonthly: number;
  sidebarCollapsed: boolean;
  /** Opens invoice or subscription sheet on the current page. */
  onOpen: () => void;
}) {
  if (cell.kind === 'NA') {
    return <SubscriptionEmptyMonthCell />;
  }

  const fullAmount = formatAmount(amountMonthly);
  const amountLabel = formatSubscriptionGridAmount(amountMonthly, sidebarCollapsed);
  const isCompact = !sidebarCollapsed;
  const statusLabel = cellStatusLabel(cell.kind);

  return (
    <button
      type="button"
      className={cn(
        MONTH_CELL_BLOCK_CLASS,
        SUBSCRIPTION_CALENDAR_SLOT_CLASS,
        cellVisualClasses(cell.kind),
      )}
      title={fullAmount}
      aria-label={`${statusLabel} · ${fullAmount}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      <span className="max-w-full truncate text-[9px] font-semibold tracking-wide uppercase opacity-90">
        {statusLabel}
      </span>
      <span
        className={cn(
          'max-w-full leading-tight font-bold tabular-nums',
          isCompact ? 'truncate text-sm' : 'truncate text-[11px]',
        )}
        title={isCompact ? fullAmount : undefined}
      >
        {amountLabel}
      </span>
    </button>
  );
}
