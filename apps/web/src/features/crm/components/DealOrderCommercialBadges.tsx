import { cn } from '@/lib/utils';
import type { DealOrder } from '@/lib/api/deals';
import {
  ORDER_EARLY_START_BADGE,
  ORDER_EXCEPTION_BADGES,
} from '../constants/deal-commercial-ui.constants';

export function DealOrderCommercialBadges({ order }: { order: DealOrder }) {
  const badges = [];

  if (order.deliveryStartMode === 'EARLY_START') {
    badges.push(ORDER_EARLY_START_BADGE);
  }

  const exceptionBadge =
    order.paymentMode && order.paymentMode !== 'STANDARD_PREPAY'
      ? ORDER_EXCEPTION_BADGES[order.paymentMode]
      : null;
  if (exceptionBadge) badges.push(exceptionBadge);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.label}
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
