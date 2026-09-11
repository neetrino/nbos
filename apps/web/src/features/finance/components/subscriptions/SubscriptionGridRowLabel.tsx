'use client';

import type { StatusVariant } from '@/components/shared';
import { getSubscriptionStatus } from '@/features/finance/constants/finance';
import {
  formatSubscriptionGridRowMeta,
  getSubscriptionDisplayTitle,
} from '@/features/finance/utils/subscription-display';
import type { Subscription } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

interface SubscriptionGridRowLabelProps {
  subscriptionName: string;
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
  subscriptionName,
  subscription,
  fallbackStatus,
}: SubscriptionGridRowLabelProps) {
  const statusMeta = getSubscriptionStatus(subscription?.status ?? fallbackStatus);
  const title = getSubscriptionDisplayTitle({
    name: subscriptionName,
    code: subscription?.code ?? subscriptionName,
  });
  const meta = subscription ? formatSubscriptionGridRowMeta(subscription) : null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 leading-tight">
        <div className="truncate font-medium" title={title}>
          {title}
        </div>
        {meta ? (
          <div
            className="text-muted-foreground truncate text-[10px] leading-none"
            title={meta.title}
          >
            {meta.text}
          </div>
        ) : null}
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
