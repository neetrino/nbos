import type { ReactNode } from 'react';
import { AlertTriangle, Calendar, DollarSign, type LucideIcon } from 'lucide-react';
import { AMD_CURRENCY_SYMBOL, formatGroupedNumber, parseMoneyAmount } from '@/lib/format/money';
import { cn } from '@/lib/utils';

export const FINANCE_LIST_SHELL_CLASS = 'border-border bg-card overflow-hidden rounded-xl border';

export const FINANCE_LIST_HEAD_CLASS = 'px-4';

export const FINANCE_LIST_CELL_CLASS = 'px-4 py-3';

export const FINANCE_LIST_BADGE_CLASS = 'rounded-full px-2.5 text-[11px]';

export const FINANCE_LIST_TYPE_CLASS =
  'text-muted-foreground text-xs font-medium tracking-wide uppercase';

export const FINANCE_LIST_ROW_HOVER_CLASS = 'hover:bg-muted/40';

const LIST_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatFinanceListDate(value: string): string {
  return LIST_DATE_FORMATTER.format(new Date(value));
}

export function FinanceListAmount({
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
      <DollarSign size={14} className="shrink-0 text-sky-500" aria-hidden />
      <span>{formatGroupedNumber(value)}</span>
      <span className="text-foreground/80 font-medium">{currencyLabel}</span>
    </span>
  );
}

export function FinanceListIconTile({
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

export function FinanceListIconLabel({
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
      <FinanceListIconTile icon={icon} className={iconClassName} />
      <span className={cn('truncate text-sm', labelClassName)}>{label}</span>
    </span>
  );
}

export function FinanceListPrimaryCell({
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

export function FinanceListDate({
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
        <span>{formatFinanceListDate(value)}</span>
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

export function FinanceListMutedDash({ children }: { children?: ReactNode }) {
  return <span className="text-muted-foreground text-xs">{children ?? '—'}</span>;
}
