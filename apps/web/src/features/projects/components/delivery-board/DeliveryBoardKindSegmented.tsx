'use client';

import { Layers, Package, Puzzle } from 'lucide-react';
import { SegmentedTabs } from '@/components/shared';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

const KIND_SEGMENTS = [
  { value: 'ALL' as const, label: 'All', icon: Layers },
  { value: 'PRODUCT' as const, label: 'Products', icon: Package },
  { value: 'EXTENSION' as const, label: 'Extensions', icon: Puzzle },
];

interface DeliveryBoardKindSegmentedProps {
  value: DeliveryBoardKindFilter;
  onValueChange: (next: DeliveryBoardKindFilter) => void;
}

/** Kind filter (All / Products / Extensions) — segmented tabs. */
export function DeliveryBoardKindSegmented({
  value,
  onValueChange,
}: DeliveryBoardKindSegmentedProps) {
  return (
    <SegmentedTabs
      value={value}
      onChange={onValueChange}
      options={KIND_SEGMENTS}
      ariaLabel="Delivery board kind"
      className="w-auto shrink-0"
      buttonClassName="h-8 px-2 py-0 text-xs leading-none"
    />
  );
}
