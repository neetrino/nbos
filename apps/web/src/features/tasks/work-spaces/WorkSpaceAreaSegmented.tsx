'use client';

import { SegmentedTabs } from '@/components/shared';
import type { WorkspaceArea } from './workspace-area';

const AREA_SEGMENTS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'planning' as const, label: 'Planning' },
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
    <SegmentedTabs
      value={value}
      onChange={onValueChange}
      options={AREA_SEGMENTS}
      ariaLabel="Work space area"
      className={className}
      listClassName="w-full sm:w-auto"
      buttonClassName="px-3 py-1.5 text-xs"
    />
  );
}
