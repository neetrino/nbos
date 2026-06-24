import Link from 'next/link';
import { ArrowUpRight, Calendar, Check, CreditCard } from 'lucide-react';
import { initialsFromEmployeeLabel } from '@/components/shared/EmployeePersonAvatar';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import { FINANCE_DASHBOARD_PANEL_CARD_CLASS } from '@/features/finance/constants/finance-dashboard-card-hover';
import type { RecentPaymentItem } from './finance-dashboard-data';

const PAYMENTS_HREF = '/finance/payments';

const PAYMENT_ROW_SHELL = 'border-border/70 rounded-xl border bg-white px-3 py-3 dark:bg-white';

const CLIENT_AVATAR_SHELLS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
] as const;

export function RecentPayments({ items }: { items: RecentPaymentItem[] }) {
  const paymentLabel =
    items.length === 1 ? '1 payment received' : `${items.length} payments received`;

  return (
    <div className={FINANCE_DASHBOARD_PANEL_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CreditCard size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-lg font-semibold">Recent Payments</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">{paymentLabel}</p>
          </div>
        </div>
        <Link
          href={PAYMENTS_HREF}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          View all payments
          <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground mt-5 text-sm">No payments yet.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((item, index) => (
            <RecentPaymentRow key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecentPaymentRow({ item, index }: { item: RecentPaymentItem; index: number }) {
  const initials = initialsFromEmployeeLabel(item.client);
  const avatarShell = CLIENT_AVATAR_SHELLS[index % CLIENT_AVATAR_SHELLS.length]!;

  return (
    <div className={cn(PAYMENT_ROW_SHELL, 'flex items-center gap-3')}>
      <div
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
        aria-hidden
      >
        <Check size={14} strokeWidth={3} />
      </div>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase',
          avatarShell,
        )}
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-foreground truncate text-sm font-semibold">{item.client}</span>
          <span className="text-muted-foreground truncate text-sm">{item.invoice}</span>
        </div>
      </div>
      <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs whitespace-nowrap">
        <Calendar size={12} aria-hidden />
        <span>{item.dateLabel}</span>
      </div>
      <span className="text-foreground shrink-0 text-sm font-bold tabular-nums">
        {formatAmount(item.amount)}
      </span>
    </div>
  );
}
