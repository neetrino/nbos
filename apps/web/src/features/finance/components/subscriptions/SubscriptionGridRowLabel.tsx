'use client';

import { StatusBadge } from '@/components/shared';
import { FINANCE_LIST_BADGE_CLASS } from '@/components/shared/entity-list-table';
import { getSubscriptionStatus, getSubscriptionType } from '@/features/finance/constants/finance';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionGridRowLabelProps {
  projectName: string;
  subscription: Subscription | undefined;
  fallbackStatus: string;
  fallbackType: string;
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
  projectName,
  subscription,
  fallbackStatus,
  fallbackType,
}: SubscriptionGridRowLabelProps) {
  const statusMeta = getSubscriptionStatus(subscription?.status ?? fallbackStatus);
  const typeMeta = getSubscriptionType(subscription?.type ?? fallbackType);
  const subtitle = typeMeta?.label ?? null;

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
          <div className="truncate font-medium" title={projectName}>
            {projectName}
          </div>
          {statusMeta ? (
            <StatusBadge
              label={statusMeta.label}
              variant={statusMeta.variant}
              className={`shrink-0 ${FINANCE_LIST_BADGE_CLASS}`}
            />
          ) : null}
        </div>
        {subtitle ? (
          <div className="text-muted-foreground truncate text-xs" title={subtitle}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
