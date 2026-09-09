'use client';

import type { ReactNode, RefObject } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_HEADER_OFFSET } from '@/components/shared/module-shell/module-shell-surface';
import { PAGE_HERO_SURFACE, PAGE_HERO_TAB_SCROLL } from './page-hero-constants';
import {
  PAGE_HERO_SEARCH_SLOT,
  PAGE_HERO_SEARCH_SLOT_EXPANDED,
  PAGE_HERO_SURFACE_CLIP,
  PAGE_HERO_SURFACE_PADDING,
  PAGE_HERO_TABS_SLOT,
  PAGE_HERO_TOOLBAR,
  PAGE_HERO_TOOLS_ROW,
  PAGE_HERO_TRAILING_COLLAPSED,
  PAGE_HERO_TRAILING_SLOT,
} from './page-hero-layout';

interface PageHeroDesktopChromeProps {
  sectionRef: RefObject<HTMLElement | null>;
  toolsRowRef: RefObject<HTMLDivElement | null>;
  tabs?: ReactNode;
  tabsEnd?: ReactNode;
  search?: ReactNode;
  secondaryTabs?: ReactNode;
  viewMode?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  hasTabsRow: boolean;
  hasSearch: boolean;
  hasToolbar: boolean;
  searchExpanded: boolean;
  filterOverflowClass?: string;
}

export function PageHeroDesktopChrome({
  sectionRef,
  toolsRowRef,
  tabs,
  tabsEnd,
  search,
  secondaryTabs,
  viewMode,
  trailing,
  className,
  hasTabsRow,
  hasSearch,
  hasToolbar,
  searchExpanded,
  filterOverflowClass,
}: PageHeroDesktopChromeProps) {
  const trailingNode =
    viewMode || trailing ? (
      <HeroTrailingActions
        searchExpanded={searchExpanded}
        viewMode={viewMode}
        trailing={trailing}
      />
    ) : null;

  return (
    <section
      ref={sectionRef}
      className={cn(
        PAGE_HERO_HEADER_OFFSET,
        PAGE_HERO_SURFACE,
        PAGE_HERO_SURFACE_CLIP,
        filterOverflowClass,
        PAGE_HERO_SURFACE_PADDING,
        className,
      )}
    >
      {hasToolbar ? (
        <div className={cn(PAGE_HERO_TOOLBAR, filterOverflowClass)}>
          {hasTabsRow ? <HeroTabsRow tabs={tabs} tabsEnd={tabsEnd} /> : null}
          {hasSearch || trailingNode ? (
            <div
              ref={toolsRowRef}
              className={cn(
                PAGE_HERO_TOOLS_ROW,
                !hasSearch &&
                  trailingNode &&
                  'ml-auto min-w-0 flex-[0_0_auto] shrink-0 justify-end',
                filterOverflowClass,
              )}
            >
              {search ? (
                <div
                  className={cn(
                    PAGE_HERO_SEARCH_SLOT,
                    searchExpanded && PAGE_HERO_SEARCH_SLOT_EXPANDED,
                    filterOverflowClass,
                  )}
                >
                  {search}
                </div>
              ) : null}
              {trailingNode}
            </div>
          ) : null}
        </div>
      ) : null}
      {secondaryTabs ? (
        <div className={cn('mt-3', PAGE_HERO_TAB_SCROLL)}>{secondaryTabs}</div>
      ) : null}
    </section>
  );
}

function HeroTabsRow({ tabs, tabsEnd }: { tabs?: ReactNode; tabsEnd?: ReactNode }) {
  return (
    <div
      className={cn(
        PAGE_HERO_TABS_SLOT,
        tabsEnd
          ? 'flex w-full min-w-0 flex-1 basis-full items-center gap-2 overflow-hidden'
          : PAGE_HERO_TAB_SCROLL,
      )}
    >
      {tabs ? (
        <div className={cn(PAGE_HERO_TAB_SCROLL, tabsEnd && 'min-w-0 flex-1')}>{tabs}</div>
      ) : null}
      {tabsEnd ? <div className="shrink-0">{tabsEnd}</div> : null}
    </div>
  );
}

function HeroTrailingActions({
  searchExpanded,
  viewMode,
  trailing,
}: {
  searchExpanded: boolean;
  viewMode?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(PAGE_HERO_TRAILING_SLOT, searchExpanded && PAGE_HERO_TRAILING_COLLAPSED)}
      aria-hidden={searchExpanded}
    >
      {viewMode}
      {trailing}
    </div>
  );
}
