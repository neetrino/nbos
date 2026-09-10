'use client';

import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';
import { HeaderQuickNote } from '@/components/layout/HeaderQuickNote';
import {
  HeaderContextBar,
  HeaderModuleTitle,
  useHeaderContextResolved,
} from '@/components/layout/header-context';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import {
  GlobalSearchMobileTrigger,
  GlobalSearchTrigger,
} from '@/features/global-search/GlobalSearchTrigger';
import type { MeResponse } from '@/lib/permissions';

interface AppChromeHeaderProps {
  moduleTitle: string | null;
  isMobileViewport: boolean;
  showQuickNote: boolean;
  me: MeResponse | null | undefined;
}

export function AppChromeHeader({
  moduleTitle,
  isMobileViewport,
  showQuickNote,
  me,
}: AppChromeHeaderProps) {
  const headerContext = useHeaderContextResolved();
  const showMobileEntityHeader =
    isMobileViewport && (headerContext?.kind === 'custom' || headerContext?.kind === 'actions');
  const showMobileNav = isMobileViewport && headerContext?.kind === 'nav';
  const showModuleTitle = Boolean(moduleTitle) && !showMobileEntityHeader;

  return (
    <header className="border-border/70 bg-background/88 supports-[backdrop-filter]:bg-background/72 sticky top-0 z-30 flex shrink-0 flex-col overflow-visible border-b backdrop-blur-md">
      <div className="flex h-16 min-w-0 items-stretch gap-3 px-4 max-md:h-14 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-stretch">
          {showModuleTitle && moduleTitle ? (
            <div
              className="mr-1 flex min-w-0 shrink items-center self-stretch sm:mr-2"
              aria-label={`Module: ${moduleTitle}`}
            >
              <HeaderModuleTitle>{moduleTitle}</HeaderModuleTitle>
            </div>
          ) : null}
          {!isMobileViewport || showMobileEntityHeader ? (
            <div className="flex min-w-0 flex-1 items-stretch overflow-hidden">
              <HeaderContextBar />
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 self-center overflow-visible sm:gap-3">
          <GlobalSearchMobileTrigger />
          <GlobalSearchTrigger />
          {showQuickNote ? (
            <div className="max-md:hidden">
              <HeaderQuickNote />
            </div>
          ) : null}
          <NotificationDropdown />
          <AccountMenuDropdown me={me} />
        </div>
      </div>
      {showMobileNav ? (
        <div className="px-4 pb-2.5 sm:px-6">
          <HeaderContextBar />
        </div>
      ) : null}
    </header>
  );
}
