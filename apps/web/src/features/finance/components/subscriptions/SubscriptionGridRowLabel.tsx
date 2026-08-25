'use client';

import type { StatusVariant } from '@/components/shared';
import { getSubscriptionStatus } from '@/features/finance/constants/finance';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { formatSubscriptionTermGridBadge } from '@/features/finance/utils/subscription-term-display';
import type { Subscription } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

interface SubscriptionGridRowLabelProps {
  rowNumber: number;
  subscriptionName: string;
  projectName: string;
  subscription: Subscription | undefined;
  fallbackStatus: string;
}

const SUBSCRIPTION_STATUS_DOT_CLASS: Record<StatusVariant, string> = {
  default: 'bg-muted-foreground',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  zinc: 'bg-zinc-500',
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  green: 'bg-green-500',
  gray: 'bg-gray-400',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
};

export function SubscriptionGridRowLabel({
  rowNumber,
  subscriptionName,
  projectName,
  subscription,
  fallbackStatus,
}: SubscriptionGridRowLabelProps) {
  const statusMeta = getSubscriptionStatus(subscription?.status ?? fallbackStatus);
  const title = getSubscriptionDisplayTitle({
    name: subscriptionName,
    code: subscription?.code ?? subscriptionName,
  });
  const termBadge =
    subscription?.termMonths != null
      ? formatSubscriptionTermGridBadge(subscription.termMonths)
      : null;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="bg-muted/50 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        aria-hidden
      >
        {rowNumber}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="truncate font-medium" title={title}>
            {title}
          </div>
          {termBadge ? (
            <span
              className="text-muted-foreground shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
              title={`${subscription?.termMonths}-month subscription term`}
            >
              {termBadge}
            </span>
          ) : null}
        </div>
        <div className="text-muted-foreground truncate text-xs" title={projectName}>
          {projectName}
        </div>
      </div>
      {statusMeta ? (
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            SUBSCRIPTION_STATUS_DOT_CLASS[statusMeta.variant],
          )}
          title={statusMeta.label}
          aria-label={statusMeta.label}
        />
      ) : null}
    </div>
  );
}
