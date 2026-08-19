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
import { cn } from '@/lib/utils';

type TopbarProps = {
  showMobileMenuButton?: boolean;
  onMobileMenuClick?: () => void;
};

export function Topbar({ showMobileMenuButton = false, onMobileMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { can, me, meLoadError } = usePermission();
  const headerContext = useHeaderContextResolved();
  const moduleTitle = useHeaderModuleTitleResolved();
  const hasBridgedZoneNav = headerContext?.kind === 'nav';
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
          'border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 flex h-16 shrink-0 items-stretch gap-3 overflow-visible px-4 backdrop-blur-md sm:gap-4 sm:px-6',
          hasBridgedZoneNav ? 'border-b-0' : 'border-b',
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
              <HeaderModuleTitle>{moduleTitle}</HeaderModuleTitle>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 items-stretch">
            <HeaderContextBar />
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 self-center overflow-visible sm:gap-3">
          <GlobalSearchMobileTrigger />
          <GlobalSearchTrigger />
          {showQuickNote ? <HeaderQuickNote /> : null}
          <NotificationDropdown />
          <AccountMenuDropdown me={me} />
        </div>
      </header>
    </>
  );
}
