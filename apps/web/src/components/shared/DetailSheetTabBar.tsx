'use client';

import type { LucideIcon } from 'lucide-react';
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
    <div className={cn('border-border shrink-0 border-b px-5 dark:border-stone-800', className)}>
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                  : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300',
              )}
            >
              {Icon ? <Icon size={16} aria-hidden /> : null}
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-sky-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
