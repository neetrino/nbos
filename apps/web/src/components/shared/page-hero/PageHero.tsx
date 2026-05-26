'use client';

import { useRef, type ReactNode } from 'react';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { cn } from '@/lib/utils';
import { PAGE_HERO_SURFACE, PAGE_HERO_TAB_SCROLL } from './page-hero-constants';
import {
  PAGE_HERO_SEARCH_SLOT,
  PAGE_HERO_SEARCH_SLOT_EXPANDED,
  PAGE_HERO_SURFACE_PADDING,
  PAGE_HERO_TABS_SLOT,
  PAGE_HERO_TOOLBAR,
  PAGE_HERO_TOOLS_ROW,
  PAGE_HERO_TRAILING_COLLAPSED,
  PAGE_HERO_TRAILING_SLOT,
} from './page-hero-layout';
import { PageHeroToolbarProvider, usePageHeroToolbar } from './page-hero-toolbar-context';
import { usePageHeroCompactToolbar } from './use-page-hero-compact-toolbar';

export interface PageHeroProps {
  title: string;
  tabs?: ReactNode;
  search?: ReactNode;
  secondaryTabs?: ReactNode;
  viewMode?: ReactNode;
  actions?: ReactNode;
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
  tabs,
  search,
  secondaryTabs,
  viewMode,
  actions,
  trailing,
  className,
}: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useHeaderModuleTitle(title);
  const { searchActive } = usePageHeroToolbar();
  const isCompactToolbar = usePageHeroCompactToolbar(sectionRef);
  const searchExpanded = searchActive && isCompactToolbar;

  const hasTrailing = Boolean(viewMode || actions || trailing);
  const hasSearch = Boolean(search);
  const hasToolbar = Boolean(tabs || hasSearch || hasTrailing);

  if (!hasToolbar && !secondaryTabs) {
    return null;
  }

  const trailingNode = hasTrailing ? (
    <HeroTrailingActions
      searchExpanded={searchExpanded}
      viewMode={viewMode}
      actions={actions}
      trailing={trailing}
    />
  ) : null;

  return (
    <section
      ref={sectionRef}
      className={cn(PAGE_HERO_SURFACE, PAGE_HERO_SURFACE_PADDING, className)}
      data-hero-search-expanded={searchExpanded ? 'true' : 'false'}
    >
      {hasToolbar ? (
        <div className={PAGE_HERO_TOOLBAR}>
          {tabs ? (
            <div className={cn(PAGE_HERO_TAB_SCROLL, PAGE_HERO_TABS_SLOT)}>{tabs}</div>
          ) : null}
          {hasSearch || trailingNode ? (
            <div className={PAGE_HERO_TOOLS_ROW}>
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
  actions,
  trailing,
}: {
  searchExpanded: boolean;
  viewMode?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(PAGE_HERO_TRAILING_SLOT, searchExpanded && PAGE_HERO_TRAILING_COLLAPSED)}
      aria-hidden={searchExpanded}
    >
      {viewMode}
      {actions}
      {trailing}
    </div>
  );
}
