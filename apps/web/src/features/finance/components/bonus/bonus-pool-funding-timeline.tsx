'use client';

import { Loader2 } from 'lucide-react';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolTimelineEvent } from '@/lib/api/bonus';

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function eventTone(kind: BonusPoolTimelineEvent['kind']): string {
  return kind === 'PAYMENT_IN'
    ? 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30'
    : 'border-amber-200/80 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/25';
}

export function BonusPoolFundingTimeline({
  events,
  loading,
  error,
}: {
  events: BonusPoolTimelineEvent[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading timeline…
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">No payments or releases yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <li
          key={`${event.kind}-${event.id}`}
          className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${eventTone(event.kind)}`}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{event.label}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {formatEventDate(event.occurredAt)}
              {event.orderCode ? ` · ${event.orderCode}` : ''}
              {event.employeeName ? ` · ${event.employeeName}` : ''}
              {event.releaseReason ? ` · ${event.releaseReason}` : ''}
            </p>
          </div>
          <span className="shrink-0 font-semibold tabular-nums">
            {event.kind === 'PAYMENT_IN' ? '+' : '−'}
            {formatBonusPoolMoney(event.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
