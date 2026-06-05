'use client';

import type { ReactNode } from 'react';
import { PageHero, ViewModeSwitch } from '@/components/shared';
import { PRODUCT_TAB_VIEW_OPTIONS } from '@/features/projects/constants/product-tab-view-options';
import type { ProjectDetailViewMode } from '@/features/projects/components/project-detail-layout.constants';

interface ProductTabViewHeroProps {
  viewMode: ProjectDetailViewMode;
  onViewModeChange: (mode: ProjectDetailViewMode) => void;
  trailing?: ReactNode;
}

/** Compact hero row for product detail entity tabs (Extensions, Tickets, Finance). */
export function ProductTabViewHero({
  viewMode,
  onViewModeChange,
  trailing,
}: ProductTabViewHeroProps) {
  return (
    <PageHero
      syncModuleTitle={false}
      className="mt-0"
      viewMode={
        <ViewModeSwitch
          value={viewMode}
          onChange={onViewModeChange}
          options={PRODUCT_TAB_VIEW_OPTIONS}
          ariaLabel="View mode"
        />
      }
      trailing={trailing}
    />
  );
}
