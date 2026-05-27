import { AMD_CURRENCY_SYMBOL } from '@/lib/format/money';
import { cn } from '@/lib/utils';

export interface AmdCurrencyIconProps {
  className?: string;
}

/** Armenian dram sign for inline money labels (CRM cards, detail sheets). */
export function AmdCurrencyIcon({ className }: AmdCurrencyIconProps) {
  return (
    <span
      className={cn('inline-flex shrink-0 text-xs leading-none font-normal', className)}
      aria-hidden
    >
      {AMD_CURRENCY_SYMBOL}
    </span>
  );
}
