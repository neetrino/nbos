'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WorkspaceArea } from './workspace-area';

const AREA_SEGMENTS: Array<{ value: WorkspaceArea; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
];

export function WorkSpaceAreaSegmented({
  value,
  onValueChange,
  className,
}: {
  value: WorkspaceArea;
  onValueChange: (area: WorkspaceArea) => void;
  className?: string;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as WorkspaceArea)}
      className={className}
    >
      <TabsList variant="segmented" className="w-full min-w-0 sm:w-auto">
        {AREA_SEGMENTS.map((segment) => (
          <TabsTrigger
            key={segment.value}
            value={segment.value}
            className="px-4 py-2 text-sm font-medium"
          >
            {segment.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
