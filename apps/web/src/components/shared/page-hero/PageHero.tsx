'use client';

import { useRegisterMobileDockTools } from '@/components/layout/MobileModuleDockProvider';
import { PageHeroDesktopChrome } from './PageHeroDesktopChrome';
import { PageHeroToolbarProvider } from './page-hero-toolbar-context';
import type { PageHeroProps } from './page-hero-types';
import { usePageHeroRenderState } from './use-page-hero-render-state';

export type { PageHeroProps } from './page-hero-types';

export function PageHero(props: PageHeroProps) {
  return (
    <PageHeroToolbarProvider>
      <PageHeroInner {...props} />
    </PageHeroToolbarProvider>
  );
}

function PageHeroInner(props: PageHeroProps) {
  const { tabs, tabsEnd, search, secondaryTabs, viewMode, trailing, className } = props;
  const state = usePageHeroRenderState(props);

  useRegisterMobileDockTools({ search, trailing, tabsEnd });

  if (!state.hasToolbar && !state.hasSecondaryTabs) {
    return null;
  }

  if (state.isMobileViewport) {
    return (
      <>
        {tabs}
        {secondaryTabs}
      </>
    );
  }

  return (
    <PageHeroDesktopChrome
      sectionRef={state.sectionRef}
      toolsRowRef={state.toolsRowRef}
      tabs={tabs}
      tabsEnd={tabsEnd}
      search={search}
      secondaryTabs={secondaryTabs}
      viewMode={viewMode}
      trailing={trailing}
      className={className}
      hasTabsRow={state.hasTabsRow}
      hasSearch={state.hasSearch}
      hasToolbar={state.hasToolbar}
      searchExpanded={state.searchExpanded}
      filterOverflowClass={state.filterOverflowClass}
    />
  );
}
