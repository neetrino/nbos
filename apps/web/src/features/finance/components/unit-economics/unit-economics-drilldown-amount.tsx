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
        'rounded-md px-1.5 py-0.5 tabular-nums underline-offset-2 transition-colors',
        'hover:bg-muted/70 hover:text-primary hover:underline',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        amount === 0 && 'text-muted-foreground',
        className,
      )}
      onClick={() => onDrilldown(orderId, focus)}
    >
      {formatted}
    </button>
  );
}
