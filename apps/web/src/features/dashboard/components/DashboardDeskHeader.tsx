'use client';

import { useMemo } from 'react';
import { useMessages } from 'next-intl';
import { usePermission } from '@/lib/permissions';
import {
  deskCopy,
  localizeDeskLineCopy,
  readDeskLineCatalogTemplates,
} from '../dashboard-desk-header';
import { useYerevanDeskClock } from '../desk-line/desk-line-clock';
import { DESK_LINE_ICON_MAP } from '../desk-line/desk-line-icons';

export function DashboardDeskHeader() {
  const messages = useMessages();
  const { me, isLoading } = usePermission();
  const now = useYerevanDeskClock();
  const ready = now != null && !isLoading && me?.id;
  const copy = useMemo(() => {
    const resolution =
      ready && now
        ? deskCopy(
            {
              employeeId: me.id,
              firstName: me.firstName,
              birthday: me.birthday,
              hireDate: me.hireDate,
              status: me.status,
            },
            now,
          )
        : deskCopy(null);
    const catalog = readDeskLineCatalogTemplates(messages.dashboardDeskLine, resolution.templateId);
    const localized = localizeDeskLineCopy(resolution, {
      title: catalog.title ?? resolution.titleTemplate,
      subline: catalog.subline ?? resolution.sublineTemplate,
    });
    return { ...resolution, ...localized };
  }, [me, messages.dashboardDeskLine, now, ready]);
  const Icon = DESK_LINE_ICON_MAP[copy.icon];

  return (
    <header className="nbos-desk-surface min-w-0 shrink-0 overflow-visible px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <Icon
            aria-hidden
            className="text-muted-foreground mt-1 size-5 shrink-0 sm:mt-1.5 sm:size-6"
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="nbos-display text-foreground min-w-0 text-2xl leading-snug text-balance break-words sm:text-3xl md:text-4xl">
            {copy.title}
          </h1>
          <p className="text-muted-foreground mt-2 min-w-0 text-sm leading-relaxed break-words">
            {copy.subline}
          </p>
        </div>
      </div>
    </header>
  );
}
