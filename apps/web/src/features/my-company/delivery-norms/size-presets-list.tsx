'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_CONFIG_SIZES, type DeliveryConfigSize } from '@nbos/shared';
import {
  SIZE_LADDER_GRID_CLASS,
  SIZE_PRESET_LEVEL_ACTIVE_CLASS,
  SIZE_PRESET_LEVEL_CLASS,
} from './delivery-norms.constants';
import { configSizeLabels } from './profile-enum-labels';
import { cn } from '@/lib/utils';

export function SizePresetsList({
  selectedSize,
  available,
  onSelect,
  counts,
  detail,
}: {
  selectedSize: DeliveryConfigSize;
  available?: Set<DeliveryConfigSize>;
  onSelect: (size: DeliveryConfigSize) => void;
  counts?: Record<DeliveryConfigSize, number>;
  detail?: (size: DeliveryConfigSize, enabled: boolean) => string;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const labels = configSizeLabels(t);
  return (
    <ul className={SIZE_LADDER_GRID_CLASS}>
      {DELIVERY_CONFIG_SIZES.map((size) => {
        const enabled = available === undefined || available.has(size);
        return (
          <li key={size}>
            <button
              type="button"
              disabled={!enabled}
              className={cn(
                SIZE_PRESET_LEVEL_CLASS,
                'flex-col items-start gap-1',
                selectedSize === size ? SIZE_PRESET_LEVEL_ACTIVE_CLASS : null,
                enabled ? null : 'cursor-not-allowed opacity-50',
              )}
              onClick={() => onSelect(size)}
            >
              <span className="text-foreground font-medium">{labels[size]}</span>
              <span className="text-muted-foreground text-xs">
                {sizeCellDetail(size, enabled, t, counts, detail)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function sizeCellDetail(
  size: DeliveryConfigSize,
  enabled: boolean,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
  counts: Record<DeliveryConfigSize, number> | undefined,
  detail: ((size: DeliveryConfigSize, enabled: boolean) => string) | undefined,
): string {
  if (detail) {
    return detail(size, enabled);
  }
  if (!enabled) {
    return t('sizePresets.missingProfile');
  }
  return countLabel(counts?.[size] ?? 0, t);
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
