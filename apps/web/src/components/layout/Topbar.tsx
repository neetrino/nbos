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
      <header className="border-border bg-card/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-sm">
        {/* Page title area */}
        <div className="flex items-center gap-4">
          <h1 className="text-foreground text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <AccountMenuDropdown me={me} />
        </div>
      </header>
    </>
  );
}
