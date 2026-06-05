'use client';

import { useRef, type ReactNode } from 'react';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { cn } from '@/lib/utils';
import { PAGE_HERO_HEADER_OFFSET } from '@/components/shared/module-shell/module-shell-surface';
import { PAGE_HERO_SURFACE, PAGE_HERO_TAB_SCROLL } from './page-hero-constants';
import {
  PAGE_HERO_OVERFLOW_FILTERS_OPEN,
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
import { PageHeroToolbarProvider, usePageHeroToolbar } from './page-hero-toolbar-context';
import { usePageHeroCompactToolbar } from './use-page-hero-compact-toolbar';
import { usePageHeroToolsRowOverflow } from './use-page-hero-tools-row-overflow';

export interface PageHeroProps {
  title?: string;
  /** When false, does not update the app header module title (e.g. entity detail with its own title). */
  syncModuleTitle?: boolean;
  tabs?: ReactNode;
  search?: ReactNode;
  secondaryTabs?: ReactNode;
  viewMode?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function PageHero(props: PageHeroProps) {
  return (
    <PageHeroToolbarProvider>
      <PageHeroInner {...props} />
    </PageHeroToolbarProvider>
  );
}

function PageHeroInner({
  title,
  syncModuleTitle = true,
  tabs,
  search,
  secondaryTabs,
  viewMode,
  trailing,
  className,
}: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const toolsRowRef = useRef<HTMLDivElement>(null);
  useHeaderModuleTitle(syncModuleTitle ? (title ?? null) : null, syncModuleTitle);

  const hasTrailing = Boolean(viewMode || trailing);
  const hasSearch = Boolean(search);
  const hasToolbar = Boolean(tabs || hasSearch || hasTrailing);

  const { searchActive, filterPanelOpen } = usePageHeroToolbar();
  const isCompactToolbar = usePageHeroCompactToolbar(sectionRef);
  const toolsRowOverflow = usePageHeroToolsRowOverflow(
    toolsRowRef,
    hasSearch && hasTrailing && isCompactToolbar,
  );
  const searchExpanded = isCompactToolbar && (searchActive || toolsRowOverflow);
  const filterOverflowClass = filterPanelOpen ? PAGE_HERO_OVERFLOW_FILTERS_OPEN : undefined;

  if (!hasToolbar && !secondaryTabs) {
    return null;
  }

  const trailingNode = hasTrailing ? (
    <HeroTrailingActions searchExpanded={searchExpanded} viewMode={viewMode} trailing={trailing} />
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
          {tabs ? (
            <div className={cn(PAGE_HERO_TAB_SCROLL, PAGE_HERO_TABS_SLOT)}>{tabs}</div>
          ) : null}
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
