'use client';

import type { LucideIcon } from 'lucide-react';
import { pillTabButtonClass } from '@/components/ui/tabs';
import {
  DETAIL_SHEET_TAB_BAR_SCROLL_CLASS,
  DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS,
} from './detail-sheet-classes';
import { TabQuickCreateButton } from './tab-quick-create/TabQuickCreateButton';
import { cn } from '@/lib/utils';

export interface DetailSheetTabQuickCreate {
  onCreate: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

export interface DetailSheetTabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Optional button class (e.g. `ml-auto` to pin last tab to the trailing edge). */
  className?: string;
  /** Hover/focus plus shortcut — opens the same create dialog as the in-tab Create button. */
  quickCreate?: DetailSheetTabQuickCreate;
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
      <div className={cn(DETAIL_SHEET_TAB_BAR_SCROLL_CLASS, 'py-0.5', scrollClassName)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const quickCreate = tab.quickCreate;
          const showQuickCreate = Boolean(quickCreate && !quickCreate.disabled);

          return (
            <div key={tab.value} className="group/tab relative shrink-0">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.value)}
                className={cn(pillTabButtonClass(isActive), 'text-[15px]', tab.className)}
              >
                {Icon ? <Icon size={17} aria-hidden /> : null}
                {tab.label}
              </button>
              {showQuickCreate && quickCreate ? (
                <TabQuickCreateButton
                  ariaLabel={quickCreate.ariaLabel}
                  onCreate={quickCreate.onCreate}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
