'use client';

import { usePermission } from '@/lib/permissions';
import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';
import { HeaderQuickNote } from '@/components/layout/HeaderQuickNote';
import { HeaderSearchButton } from '@/components/layout/HeaderSearchButton';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';

export function Topbar() {
  const { can, me, meLoadError } = usePermission();
  const showQuickNote = can('VIEW', 'DASHBOARDS');

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
      <header className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <HeaderSearchButton />
          {showQuickNote ? <HeaderQuickNote /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationDropdown />
          <AccountMenuDropdown me={me} />
        </div>
      </header>
    </>
  );
}
