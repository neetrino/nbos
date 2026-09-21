'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_CONFIG_SIZES, type DeliveryConfigSize } from '@nbos/shared';
import {
  SIZE_PRESET_LEVEL_ACTIVE_CLASS,
  SIZE_PRESET_LEVEL_CLASS,
} from './delivery-norms.constants';
import { configSizeLabels } from './profile-enum-labels';
import { cn } from '@/lib/utils';

export function SizePresetsList({
  counts,
  selectedSize,
  onSelect,
}: {
  counts: Record<DeliveryConfigSize, number>;
  selectedSize: DeliveryConfigSize;
  onSelect: (size: DeliveryConfigSize) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const labels = configSizeLabels(t);
  return (
    <ul className="space-y-2">
      {DELIVERY_CONFIG_SIZES.map((size) => (
        <li key={size}>
          <button
            type="button"
            className={cn(
              SIZE_PRESET_LEVEL_CLASS,
              selectedSize === size ? SIZE_PRESET_LEVEL_ACTIVE_CLASS : null,
            )}
            onClick={() => onSelect(size)}
          >
            <span className="text-foreground font-medium">{labels[size]}</span>
            <span className="text-muted-foreground text-xs">{countLabel(counts[size], t)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function countLabel(
  count: number,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (count === 0) {
    return t('sizePresets.cleared');
  }
  return t('sizePresets.selectedCount', { count });
}
