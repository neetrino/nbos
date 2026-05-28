'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

export function UnitEconomicsDrilldownAmount({
  amount,
  orderId,
  focus,
  onDrilldown,
  className,
}: {
  amount: number;
  orderId: string;
  focus: UnitEconomicsDrilldownFocus;
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
  className?: string;
}) {
  const formatted = formatAmount(amount);
  if (!onDrilldown) {
    return <span className={cn('tabular-nums', className)}>{formatted}</span>;
  }
  return (
    <button
      type="button"
      className={cn(
        'hover:text-primary tabular-nums underline-offset-2 hover:underline',
        className,
      )}
      onClick={() => onDrilldown(orderId, focus)}
    >
      {formatted}
    </button>
  );
}
