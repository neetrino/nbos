'use client';

import { PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { activeCallDirectionLabelKey, activeCallPhaseLabelKey } from './active-call-labels';
import { formatCallDuration } from './format-call-duration';

export function ActiveCallRecentCalls({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const t = useTranslations('crm');
  const items = snapshot?.recentCalls ?? [];

  return (
    <section>
      <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
        {t('calls.recentCalls')}
      </h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs">—</p>
      ) : (
        <ol className="max-h-40 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <RecentCallRow key={item.id} item={item} />
          ))}
        </ol>
      )}
    </section>
  );
}

function RecentCallRow({ item }: { item: ActiveCallScreenSnapshot['recentCalls'][number] }) {
  const t = useTranslations('crm');
  const Icon = item.direction === 'OUTBOUND' ? PhoneOutgoing : PhoneIncoming;
  return (
    <li className="flex items-start gap-2.5 py-1">
      <span className="bg-muted text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-3" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-foreground min-w-0 truncate text-xs font-medium">
            {t(activeCallDirectionLabelKey(item.direction) as never)} ·{' '}
            {t(activeCallPhaseLabelKey(item.phase) as never)}
          </p>
          <p className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
            {formatCallDuration(item.durationSec)}
          </p>
        </div>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          {formatRecentCallWhen(item.createdAt)}
        </p>
      </div>
    </li>
  );
}

function formatRecentCallWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
