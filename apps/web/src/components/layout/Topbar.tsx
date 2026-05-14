'use client';

import { usePermission } from '@/lib/permissions';
import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';

export function Topbar() {
  const { me, meLoadError } = usePermission();

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
      <header className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end gap-2 border-b px-4 backdrop-blur-md sm:px-6">
        <NotificationDropdown />
        <AccountMenuDropdown me={me} />
      </header>
    </>
  );
}
