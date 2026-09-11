'use client';

import { PageHeroTabs } from '@/components/shared';
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
    <PageHeroTabs
      value={value}
      onChange={onValueChange}
      options={AREA_SEGMENTS}
      ariaLabel="Work space area"
      className={className}
      showOnMobile
      registerMobileDock={false}
    />
  );
}
