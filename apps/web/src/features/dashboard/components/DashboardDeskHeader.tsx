'use client';

import { usePermission } from '@/lib/permissions';
import {
  DASHBOARD_DESK_KICKER,
  DASHBOARD_DESK_SUBLINE,
  deskHeading,
} from '../dashboard-desk-header';

export function DashboardDeskHeader() {
  const { me } = usePermission();
  const heading = deskHeading(me?.firstName);

  return (
    <header className="nbos-desk-surface px-5 py-5 sm:px-6 sm:py-6">
      <p className="nbos-desk-kicker">{DASHBOARD_DESK_KICKER}</p>
      <h1 className="nbos-display text-foreground mt-2 text-3xl sm:text-4xl">{heading}</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
        {DASHBOARD_DESK_SUBLINE}
      </p>
    </header>
  );
}
