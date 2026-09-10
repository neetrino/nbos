'use client';

import { usePathname } from 'next/navigation';
import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';
import { HeaderQuickNote } from '@/components/layout/HeaderQuickNote';
import {
  HeaderContextBar,
  HeaderModuleTitle,
  useHeaderContextResolved,
} from '@/components/layout/header-context';
import { HEADER_MODULE_TITLE_ICON_WRAP } from '@/components/layout/header-context/header-module-title-constants';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import { SidebarModuleIcon } from '@/components/layout/SidebarModuleIcon';
import {
  GlobalSearchMobileTrigger,
  GlobalSearchTrigger,
} from '@/features/global-search/GlobalSearchTrigger';
import { resolveSidebarModuleKeyFromPathname } from '@/lib/navigation/nav-route-utils';
import type { MeResponse } from '@/lib/permissions';
import { cn } from '@/lib/utils';

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
  const pathname = usePathname();
  const headerContext = useHeaderContextResolved();
  const showMobileEntityHeader =
    isMobileViewport && (headerContext?.kind === 'custom' || headerContext?.kind === 'actions');
  const showMobileNav = isMobileViewport && headerContext?.kind === 'nav';
  const mobileNavAsTabs =
    headerContext?.kind === 'nav' && headerContext.mobileVariant === 'tabs';
  const showModuleTitle = Boolean(moduleTitle) && !showMobileEntityHeader;
  const moduleKey = isMobileViewport ? resolveSidebarModuleKeyFromPathname(pathname) : null;

  return (
    <header
      className={cn(
        'border-border/70 bg-background/88 supports-[backdrop-filter]:bg-background/72 sticky top-0 z-30 flex shrink-0 flex-col overflow-visible border-b backdrop-blur-md',
        showMobileNav && mobileNavAsTabs && 'border-b-0',
      )}
    >
      <AppChromeHeaderPrimaryRow
        moduleTitle={moduleTitle}
        isMobileViewport={isMobileViewport}
        showQuickNote={showQuickNote}
        showMobileEntityHeader={showMobileEntityHeader}
        showModuleTitle={showModuleTitle}
        moduleKey={moduleKey}
        me={me}
      />
      {showMobileNav ? <AppChromeHeaderMobileNav asTabs={Boolean(mobileNavAsTabs)} /> : null}
    </header>
  );
}

function AppChromeHeaderPrimaryRow({
  moduleTitle,
  isMobileViewport,
  showQuickNote,
  showMobileEntityHeader,
  showModuleTitle,
  moduleKey,
  me,
}: {
  moduleTitle: string | null;
  isMobileViewport: boolean;
  showQuickNote: boolean;
  showMobileEntityHeader: boolean;
  showModuleTitle: boolean;
  moduleKey: ReturnType<typeof resolveSidebarModuleKeyFromPathname>;
  me: MeResponse | null | undefined;
}) {
  return (
    <div className="flex h-16 min-w-0 items-stretch gap-3 px-4 max-md:h-14 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-stretch">
        {showModuleTitle && moduleTitle ? (
          <div
            className="mr-1 flex min-w-0 shrink items-center self-stretch sm:mr-2"
            aria-label={`Module: ${moduleTitle}`}
          >
            <HeaderModuleTitle
              leadingIcon={
                moduleKey ? (
                  <span className={HEADER_MODULE_TITLE_ICON_WRAP}>
                    <SidebarModuleIcon moduleKey={moduleKey} active />
                  </span>
                ) : null
              }
            >
              {moduleTitle}
            </HeaderModuleTitle>
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
  );
}

function AppChromeHeaderMobileNav({ asTabs }: { asTabs: boolean }) {
  return (
    <div
      className={cn(
        'min-w-0 px-4 sm:px-6',
        asTabs ? 'overflow-x-auto' : 'overflow-x-hidden pb-2.5',
      )}
    >
      <HeaderContextBar />
    </div>
  );
}
