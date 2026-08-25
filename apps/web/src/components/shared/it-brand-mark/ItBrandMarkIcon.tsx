import { cn } from '@/lib/utils';
import type { BrandMark } from '@/lib/it-brand-marks/brand-mark';

interface ItBrandMarkIconProps {
  mark: BrandMark;
  className?: string;
}

export function ItBrandMarkIcon({ mark, className }: ItBrandMarkIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-4 shrink-0 fill-current', className)}>
      <path d={mark.path} />
    </svg>
  );
}
