'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { DealOrder } from '@/lib/api/deals';
import {
  ORDER_EARLY_START_BADGE,
  ORDER_EXCEPTION_BADGES,
} from '../constants/deal-commercial-ui.constants';

export function DealOrderCommercialBadges({ order }: { order: DealOrder }) {
  const t = useTranslations('crm');
  const badges = [];

  if (order.deliveryStartMode === 'EARLY_START') {
    badges.push({
      key: 'early-start',
      label: t('dealSheet.badges.earlyStart'),
      className: ORDER_EARLY_START_BADGE.className,
    });
  }

  const exceptionBadge =
    order.paymentMode && order.paymentMode !== 'STANDARD_PREPAY'
      ? ORDER_EXCEPTION_BADGES[order.paymentMode]
      : null;
  if (exceptionBadge && order.paymentMode === 'POSTPAID') {
    badges.push({
      key: 'postpaid',
      label: t('dealSheet.badges.postpaid'),
      className: exceptionBadge.className,
    });
  } else if (exceptionBadge && order.paymentMode === 'FREE') {
    badges.push({
      key: 'free',
      label: t('dealSheet.badges.freeException'),
      className: exceptionBadge.className,
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
            badge.className,
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
