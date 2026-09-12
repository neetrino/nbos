'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Layers, Package, Puzzle } from 'lucide-react';
import { SegmentedTabs } from '@/components/shared';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

interface DeliveryBoardKindSegmentedProps {
  value: DeliveryBoardKindFilter;
  onValueChange: (next: DeliveryBoardKindFilter) => void;
}

/** Kind filter (All / Products / Extensions) — segmented tabs. */
export function DeliveryBoardKindSegmented({
  value,
  onValueChange,
}: DeliveryBoardKindSegmentedProps) {
  const t = useTranslations('deliveryBoard');
  const options = useMemo(
    () => [
      { value: 'ALL' as const, label: t('kind.all'), icon: Layers },
      { value: 'PRODUCT' as const, label: t('kind.products'), icon: Package },
      { value: 'EXTENSION' as const, label: t('kind.extensions'), icon: Puzzle },
    ],
    [t],
  );

  return (
    <SegmentedTabs
      value={value}
      onChange={onValueChange}
      options={options}
      ariaLabel={t('kind.aria')}
      className="w-auto shrink-0"
      buttonClassName="h-8 px-2 py-0 text-xs leading-none"
    />
  );
}
