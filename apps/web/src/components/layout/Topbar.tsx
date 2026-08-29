'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { usePermission } from '@/lib/permissions';
import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';
import { HeaderQuickNote } from '@/components/layout/HeaderQuickNote';
import { isHeaderQuickNoteHiddenPath } from '@/components/layout/header-quick-note-constants';
import {
  HeaderContextBar,
  HeaderModuleTitle,
  useHeaderContextResolved,
  useHeaderModuleTitleResolved,
} from '@/components/layout/header-context';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import {
  GlobalSearchMobileTrigger,
  GlobalSearchTrigger,
} from '@/features/global-search/GlobalSearchTrigger';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';

/** Primary chrome row height (menu / title / actions). */
const TOPBAR_PRIMARY_ROW_CLASS = 'h-16';

/** Stacked zone-tab row on mobile (HeaderContextNav + connector). */
const TOPBAR_ZONE_NAV_ROW_CLASS = 'h-14';
type TopbarProps = {
  showMobileMenuButton?: boolean;
  onMobileMenuClick?: () => void;
};

export function Topbar({ showMobileMenuButton = false, onMobileMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { can, me, meLoadError } = usePermission();
  const headerContext = useHeaderContextResolved();
  const moduleTitle = useHeaderModuleTitleResolved();
  const isMobileViewport = useIsMobileViewport();
  const hasBridgedZoneNav = headerContext?.kind === 'nav';
  /** Mobile: zone tabs sit on their own row above PageHero (previous connector design). */
  const stackZoneNav = hasBridgedZoneNav && isMobileViewport;
  const showQuickNote = can('VIEW', 'DASHBOARDS') && !isHeaderQuickNoteHiddenPath(pathname);

  return (
    <>
      {meLoadError ? (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive border-destructive/20 sticky top-0 z-40 border-b px-6 py-2 text-center text-sm font-medium"
        >
          {meLoadError}
        </div>
      ) : null}
      <header
        className={cn(
          'border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 flex shrink-0 overflow-visible px-4 backdrop-blur-md sm:px-6',
          stackZoneNav
            ? 'h-auto flex-col items-stretch gap-0'
            : cn(TOPBAR_PRIMARY_ROW_CLASS, 'flex-row items-stretch gap-3 sm:gap-4'),
          hasBridgedZoneNav ? 'border-b-0' : 'border-b',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-stretch gap-3 sm:gap-4',
            stackZoneNav ? cn(TOPBAR_PRIMARY_ROW_CLASS, 'w-full') : 'min-w-0 flex-1',
          )}
        >
          {showMobileMenuButton ? (
            <button
              type="button"
              onClick={onMobileMenuClick}
              aria-label="Open navigation"
              className="text-muted-foreground hover:bg-secondary hover:text-foreground -ml-1 flex size-9 shrink-0 items-center justify-center self-center rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          ) : null}
          <div className="flex min-w-0 flex-1 items-stretch">
            {moduleTitle ? (
              <div
                className="mr-1 flex shrink-0 items-center self-stretch sm:mr-2"
                aria-label={`Module: ${moduleTitle}`}
              >
                <HeaderModuleTitle showDivider={!stackZoneNav}>{moduleTitle}</HeaderModuleTitle>
              </div>
            ) : null}
            {!stackZoneNav ? (
              <div className="flex min-w-0 flex-1 items-stretch">
                <HeaderContextBar />
              </div>
            ) : null}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 self-center overflow-visible sm:gap-3">
            <GlobalSearchMobileTrigger />
            <GlobalSearchTrigger />
            {showQuickNote ? <HeaderQuickNote /> : null}
            <NotificationDropdown />
            <AccountMenuDropdown me={me} />
          </div>
        </div>
        {stackZoneNav ? (
          <div className={cn('flex min-w-0 w-full items-stretch', TOPBAR_ZONE_NAV_ROW_CLASS)}>
            <HeaderContextBar />
          </div>
        ) : null}
      </header>
    </>
  );
}
