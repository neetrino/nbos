'use client';

import type { LucideIcon } from 'lucide-react';
import {
  DETAIL_SHEET_TAB_ACTIVE_CLASS,
  DETAIL_SHEET_TAB_BAR_SCROLL_CLASS,
  DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS,
  DETAIL_SHEET_TAB_BUTTON_BASE_CLASS,
  DETAIL_SHEET_TAB_INACTIVE_CLASS,
  DETAIL_SHEET_TAB_INDICATOR_CLASS,
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
}

/** CRM Deal-style tab strip for entity detail sheets. */
export function DetailSheetTabBar({
  tabs,
  activeTab,
  onTabChange,
  className,
}: DetailSheetTabBarProps) {
  return (
    <div className={cn(DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS, className)}>
      <div className={DETAIL_SHEET_TAB_BAR_SCROLL_CLASS}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                DETAIL_SHEET_TAB_BUTTON_BASE_CLASS,
                isActive ? DETAIL_SHEET_TAB_ACTIVE_CLASS : DETAIL_SHEET_TAB_INACTIVE_CLASS,
              )}
            >
              {Icon ? <Icon size={16} aria-hidden /> : null}
              {tab.label}
              {isActive ? <span className={DETAIL_SHEET_TAB_INDICATOR_CLASS} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
