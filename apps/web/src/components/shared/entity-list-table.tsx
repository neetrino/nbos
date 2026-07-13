import type { ReactNode } from 'react';
import { AlertTriangle, Calendar, type LucideIcon } from 'lucide-react';
import { AMD_CURRENCY_SYMBOL, formatGroupedNumber, parseMoneyAmount } from '@/lib/format/money';
import { cn } from '@/lib/utils';

/** Shared shell for module list/table views (board|list dual views). */
export const ENTITY_LIST_SHELL_CLASS = 'border-border bg-card rounded-xl border';

/**
 * Scrollable list shell — fills remaining height.
 * Do not pair with `overflow-hidden` (breaks end-of-list scrolling).
 */
export const ENTITY_LIST_SCROLL_SHELL_CLASS =
  'border-border bg-card min-h-0 flex-1 overflow-auto rounded-xl border';

export const ENTITY_LIST_HEAD_CLASS = 'px-4';

export const ENTITY_LIST_CELL_CLASS = 'px-4 py-3';

export const ENTITY_LIST_BADGE_CLASS = 'rounded-full px-2.5 text-[11px]';

export const ENTITY_LIST_TYPE_CLASS =
  'text-muted-foreground text-xs font-medium tracking-wide uppercase';

export const ENTITY_LIST_ROW_HOVER_CLASS = 'hover:bg-muted/40';

/** @deprecated Prefer {@link ENTITY_LIST_SHELL_CLASS}. */
export const FINANCE_LIST_SHELL_CLASS = ENTITY_LIST_SHELL_CLASS;
/** @deprecated Prefer {@link ENTITY_LIST_HEAD_CLASS}. */
export const FINANCE_LIST_HEAD_CLASS = ENTITY_LIST_HEAD_CLASS;
/** @deprecated Prefer {@link ENTITY_LIST_CELL_CLASS}. */
export const FINANCE_LIST_CELL_CLASS = ENTITY_LIST_CELL_CLASS;
/** @deprecated Prefer {@link ENTITY_LIST_BADGE_CLASS}. */
export const FINANCE_LIST_BADGE_CLASS = ENTITY_LIST_BADGE_CLASS;
/** @deprecated Prefer {@link ENTITY_LIST_TYPE_CLASS}. */
export const FINANCE_LIST_TYPE_CLASS = ENTITY_LIST_TYPE_CLASS;
/** @deprecated Prefer {@link ENTITY_LIST_ROW_HOVER_CLASS}. */
export const FINANCE_LIST_ROW_HOVER_CLASS = ENTITY_LIST_ROW_HOVER_CLASS;

const LIST_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatEntityListDate(value: string): string {
  return LIST_DATE_FORMATTER.format(new Date(value));
}

/** @deprecated Prefer {@link formatEntityListDate}. */
export const formatFinanceListDate = formatEntityListDate;

export function EntityListAmount({
  amount,
  currency = 'AMD',
  className,
}: {
  amount: number | string;
  currency?: string;
  className?: string;
}) {
  const value = typeof amount === 'number' ? amount : parseMoneyAmount(amount);
  const currencyLabel = currency === 'AMD' ? AMD_CURRENCY_SYMBOL : currency;

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm font-semibold tabular-nums', className)}
    >
      <span>{formatGroupedNumber(value)}</span>
      <span className="text-foreground/80 font-medium">{currencyLabel}</span>
    </span>
  );
}

/** @deprecated Prefer {@link EntityListAmount}. */
export const FinanceListAmount = EntityListAmount;

export function EntityListIconTile({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className: string;
}) {
  return (
    <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', className)}>
      <Icon size={13} aria-hidden />
    </span>
  );
}

/** @deprecated Prefer {@link EntityListIconTile}. */
export const FinanceListIconTile = EntityListIconTile;

export function EntityListIconLabel({
  icon,
  iconClassName,
  label,
  labelClassName,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  labelClassName?: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <EntityListIconTile icon={icon} className={iconClassName} />
      <span className={cn('truncate text-sm', labelClassName)}>{label}</span>
    </span>
  );
}

/** @deprecated Prefer {@link EntityListIconLabel}. */
export const FinanceListIconLabel = EntityListIconLabel;

export function EntityListPrimaryCell({
  title,
  subtitle,
  subtitleIcon: SubtitleIcon,
}: {
  title: string;
  subtitle?: string | null;
  subtitleIcon?: LucideIcon;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="truncate text-sm font-bold">{title}</p>
      {subtitle ? (
        <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
          {SubtitleIcon ? <SubtitleIcon size={12} className="shrink-0" aria-hidden /> : null}
          <span className="truncate">{subtitle}</span>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer {@link EntityListPrimaryCell}. */
export const FinanceListPrimaryCell = EntityListPrimaryCell;

export function EntityListDate({
  value,
  overdueDays = 0,
  emptyLabel = '—',
}: {
  value: string | null | undefined;
  overdueDays?: number;
  emptyLabel?: string;
}) {
  if (!value) {
    return <span className="text-muted-foreground text-xs">{emptyLabel}</span>;
  }

  return (
    <div className="space-y-1">
      <div className="text-foreground flex items-center gap-1.5 text-xs">
        <Calendar size={12} className="text-muted-foreground shrink-0" aria-hidden />
        <span>{formatEntityListDate(value)}</span>
      </div>
      {overdueDays > 0 ? (
        <div className="flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertTriangle size={11} className="shrink-0" aria-hidden />
          {overdueDays}d overdue
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer {@link EntityListDate}. */
export const FinanceListDate = EntityListDate;

export function EntityListMutedDash({ children }: { children?: ReactNode }) {
  return <span className="text-muted-foreground text-xs">{children ?? '—'}</span>;
}

/** @deprecated Prefer {@link EntityListMutedDash}. */
export const FinanceListMutedDash = EntityListMutedDash;
