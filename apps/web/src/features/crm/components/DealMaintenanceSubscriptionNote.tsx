'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { getSubscriptionStatus } from '@/features/finance/constants/finance';
import { subscriptionsListWithOpenSubscriptionHref } from '@/features/finance/constants/subscription-deep-link';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import type { Deal } from '@/lib/api/deals';

interface DealMaintenanceSubscriptionNoteProps {
  deal: Deal;
}

/** MAINTENANCE deal: shows the product's live maintenance subscription that Deal Won reuses. */
export function DealMaintenanceSubscriptionNote({ deal }: DealMaintenanceSubscriptionNoteProps) {
  const t = useTranslations('crm');
  if (deal.type !== 'MAINTENANCE') return null;

  const subscription = deal.handoff?.maintenanceSubscription ?? null;
  if (!subscription) {
    if (deal.status !== 'WON') return null;
    return (
      <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
        {t('dealSheet.handoff.maintenanceSubscriptionMissing')}
      </p>
    );
  }

  const status = getSubscriptionStatus(subscription.status)?.label ?? subscription.status;

  return (
    <Link
      href={subscriptionsListWithOpenSubscriptionHref(subscription.id)}
      className="border-border bg-background hover:bg-muted flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
    >
      <span className="flex min-w-0 items-start gap-2">
        <RefreshCw className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            {t('dealSheet.handoff.maintenanceSubscriptionTitle', {
              title: getSubscriptionDisplayTitle(subscription),
              code: subscription.code,
              status,
            })}
          </span>
          <span className="text-muted-foreground block text-[11px] leading-snug">
            {t('dealSheet.handoff.maintenanceSubscriptionHint')}
          </span>
        </span>
      </span>
      <ExternalLink className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
    </Link>
  );
}
