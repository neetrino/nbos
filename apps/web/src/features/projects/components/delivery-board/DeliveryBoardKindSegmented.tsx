'use client';

import { Layers, Package, Puzzle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

export type DeliveryBoardKindTabsTier = 'primary' | 'secondary';

interface DeliveryBoardKindSegmentedProps {
  value: DeliveryBoardKindFilter;
  onValueChange: (next: DeliveryBoardKindFilter) => void;
  /**
   * `primary` (default) — `TabsList` `segmented`.
   * `secondary` — `TabsList` `line` (compact underline tabs).
   */
  tier?: DeliveryBoardKindTabsTier;
}

/**
 * Kind filter (All / Products / Extensions). Defaults to `segmented` (`TabsList` variant).
 */
export function DeliveryBoardKindSegmented({
  value,
  onValueChange,
  tier = 'primary',
}: DeliveryBoardKindSegmentedProps) {
  const isPrimary = tier === 'primary';

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as DeliveryBoardKindFilter)}
      className="w-auto shrink-0"
    >
      <TabsList
        variant={isPrimary ? 'segmented' : 'line'}
        className={cn(isPrimary ? 'w-auto shrink-0' : '!w-auto w-max shrink-0')}
      >
        {KIND_SEGMENTS.map(({ value: segmentValue, label, Icon }) => (
          <TabsTrigger
            key={segmentValue}
            value={segmentValue}
            className={cn(
              isPrimary
                ? 'h-8 gap-1 px-2 py-0 text-xs leading-none font-medium'
                : 'h-8 gap-1 px-2 py-0 text-xs leading-none font-medium sm:px-2.5',
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
