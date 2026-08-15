'use client';

import { StatusBadge } from '@/components/shared';
import { FINANCE_LIST_BADGE_CLASS } from '@/components/shared/entity-list-table';
import { getSubscriptionStatus } from '@/features/finance/constants/finance';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { formatSubscriptionTermGridBadge } from '@/features/finance/utils/subscription-term-display';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionGridRowLabelProps {
  subscriptionName: string;
  projectName: string;
  subscription: Subscription | undefined;
  fallbackStatus: string;
}

function projectInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  const second = parts[1];
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
}

export function SubscriptionGridRowLabel({
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
        className="bg-muted/50 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        aria-hidden
      >
        {projectInitials(projectName)}
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
          {statusMeta ? (
            <StatusBadge
              label={statusMeta.label}
              variant={statusMeta.variant}
              className={`shrink-0 ${FINANCE_LIST_BADGE_CLASS}`}
            />
          ) : null}
        </div>
        <div className="text-muted-foreground truncate text-xs" title={projectName}>
          {projectName}
        </div>
      </div>
    </div>
  );
}
