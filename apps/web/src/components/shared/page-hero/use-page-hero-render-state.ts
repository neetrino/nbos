import { useContext, useRef } from 'react';
import {
  HeaderModuleTitleLockedContext,
  useHeaderModuleTitle,
} from '@/components/layout/header-context';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { PAGE_HERO_OVERFLOW_FILTERS_OPEN } from './page-hero-layout';
import { usePageHeroToolbar } from './page-hero-toolbar-context';
import { usePageHeroCompactToolbar } from './use-page-hero-compact-toolbar';
import { usePageHeroToolsRowOverflow } from './use-page-hero-tools-row-overflow';
import type { PageHeroProps } from './page-hero-types';

export function usePageHeroRenderState({
  title,
  syncModuleTitle = true,
  tabs,
  tabsEnd,
  search,
  secondaryTabs,
  viewMode,
  trailing,
}: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const toolsRowRef = useRef<HTMLDivElement>(null);
  const moduleTitleLocked = useContext(HeaderModuleTitleLockedContext);
  const shouldSyncModuleTitle = syncModuleTitle && !moduleTitleLocked;
  useHeaderModuleTitle(shouldSyncModuleTitle ? (title ?? null) : null, shouldSyncModuleTitle);

  const hasSearch = Boolean(search);
  const hasTrailing = Boolean(viewMode || trailing);
  const hasTabsRow = Boolean(tabs || tabsEnd);
  const hasToolbar = Boolean(hasTabsRow || hasSearch || hasTrailing);
  const isMobileViewport = useIsMobileViewport();
  const { searchActive, filterPanelOpen } = usePageHeroToolbar();
  const isCompactToolbar = usePageHeroCompactToolbar(sectionRef);
  const toolsRowOverflow = usePageHeroToolsRowOverflow(
    toolsRowRef,
    hasSearch && hasTrailing && isCompactToolbar && !isMobileViewport,
  );

  return {
    sectionRef,
    toolsRowRef,
    hasSearch,
    hasTabsRow,
    hasToolbar,
    isMobileViewport,
    searchExpanded: isCompactToolbar && (searchActive || toolsRowOverflow),
    filterOverflowClass: filterPanelOpen ? PAGE_HERO_OVERFLOW_FILTERS_OPEN : undefined,
    hasSecondaryTabs: Boolean(secondaryTabs),
  };
}
