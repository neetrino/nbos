'use client';

import { usePathname } from 'next/navigation';
import { usePermission } from '@/lib/permissions';
import { isHeaderQuickNoteHiddenPath } from '@/components/layout/header-quick-note-constants';
import { useHeaderModuleTitleResolved } from '@/components/layout/header-context';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { AppChromeHeader } from './AppChromeHeader';

export function Topbar() {
  const pathname = usePathname();
  const { can, me, meLoadError } = usePermission();
  const moduleTitle = useHeaderModuleTitleResolved();
  const isMobileViewport = useIsMobileViewport();
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
      <AppChromeHeader
        moduleTitle={moduleTitle}
        isMobileViewport={isMobileViewport}
        showQuickNote={showQuickNote}
        me={me}
      />
    </>
  );
}
