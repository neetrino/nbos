'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import { Sheet } from '@/components/ui/sheet';
import { usePermission } from '@/lib/permissions';
import type { NotificationDto } from '@/lib/api/notifications';
import { notificationsApi } from '@/lib/api/notifications';
import { useNotificationFeed } from '@/lib/notifications/use-notification-feed';
import { NotificationInboxSheet } from './NotificationInboxSheet';

export function NotificationDropdown() {
  const { me } = usePermission();
  const employeeId = me?.id;
  const tNav = useTranslations('navigation');
  const locale = resolveDatePickerLocale(useLocale());
  const [open, setOpen] = useState(false);
  const {
    items,
    unreadCount,
    listLoading,
    listLoadingMore,
    listError,
    hasMore,
    markAllRead,
    applyLocalRead,
    loadMore,
  } = useNotificationFeed(employeeId, open);

  async function onRowOpen(notification: NotificationDto) {
    if (employeeId && !notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        applyLocalRead(notification.id);
      } catch {
        /* still follow link */
      }
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="text-muted-foreground hover:bg-secondary hover:text-foreground relative rounded-lg p-2 transition-colors"
        aria-label={tNav('notifications.trigger')}
        aria-expanded={open}
      >
        <Bell size={20} />
        {employeeId && unreadCount > 0 ? (
          <span className="bg-accent text-accent-foreground absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <NotificationInboxSheet
          open={open}
          employeeId={employeeId}
          items={items}
          unreadCount={unreadCount}
          listLoading={listLoading}
          listLoadingMore={listLoadingMore}
          listError={listError}
          hasMore={hasMore}
          locale={locale}
          onRowOpen={(notification) => void onRowOpen(notification)}
          onMarkAllRead={() => void markAllRead()}
          onLoadMore={() => void loadMore()}
          onOpenCenter={() => setOpen(false)}
        />
      </Sheet>
    </>
  );
}
