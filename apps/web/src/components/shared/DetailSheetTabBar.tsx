'use client';

import type { LucideIcon } from 'lucide-react';
import {
  DETAIL_SHEET_TAB_BAR_SCROLL_CLASS,
  DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS,
  detailSheetTabButtonClass,
} from './detail-sheet-classes';
import { cn } from '@/lib/utils';

export interface DetailSheetTabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface DetailSheetTabBarProps {
  tabs: readonly DetailSheetTabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
  scrollClassName?: string;
}

/** Primary tab strip for entity detail sheets and inline detail panels. */
export function DetailSheetTabBar({
  tabs,
  activeTab,
  onTabChange,
  className,
  scrollClassName,
}: DetailSheetTabBarProps) {
  return (
    <div className={cn(DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS, className)}>
      <div className={cn(DETAIL_SHEET_TAB_BAR_SCROLL_CLASS, scrollClassName)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={detailSheetTabButtonClass(activeTab === tab.value)}
            >
              {Icon ? <Icon size={16} aria-hidden /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
