'use client';

import { Layers, Package, Puzzle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

const KIND_SEGMENTS: Array<{
  value: DeliveryBoardKindFilter;
  label: string;
  Icon: typeof Layers;
}> = [
  { value: 'ALL', label: 'All', Icon: Layers },
  { value: 'PRODUCT', label: 'Products', Icon: Package },
  { value: 'EXTENSION', label: 'Extensions', Icon: Puzzle },
];

interface DeliveryBoardKindSegmentedProps {
  value: DeliveryBoardKindFilter;
  onValueChange: (next: DeliveryBoardKindFilter) => void;
}

/**
 * Kind filter (All / Products / Extensions) using the same segmented Tabs pattern as other board filters.
 */
export function DeliveryBoardKindSegmented({
  value,
  onValueChange,
}: DeliveryBoardKindSegmentedProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as DeliveryBoardKindFilter)}>
      <TabsList variant="segmented" className="shrink-0">
        {KIND_SEGMENTS.map(({ value: segmentValue, label, Icon }) => (
          <TabsTrigger
            key={segmentValue}
            value={segmentValue}
            className="gap-1.5 px-3 py-2 text-xs"
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
