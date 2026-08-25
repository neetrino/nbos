import { cn } from '@/lib/utils';
import type { BrandMark } from '@/lib/it-brand-marks/brand-mark';
import {
  DARK_BRAND_ON_DARK_FILL_CLASS,
  isDarkBrandHex,
} from '@/lib/it-brand-marks/brand-mark-fill';

interface ItBrandMarkIconProps {
  mark: BrandMark;
  className?: string;
}

export function ItBrandMarkIcon({ mark, className }: ItBrandMarkIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill={`#${mark.hex}`}
      className={cn(
        'size-4 shrink-0',
        isDarkBrandHex(mark.hex) && DARK_BRAND_ON_DARK_FILL_CLASS,
        className,
      )}
    >
      <path d={mark.path} fillRule={mark.fillRule} />
    </svg>
  );
}
