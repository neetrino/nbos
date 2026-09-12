'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EntityDetailSheetContent } from '@/components/shared';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { NotificationDto } from '@/lib/api/notifications';
import { formatNotificationInboxTime } from '@/lib/notifications/notification-inbox-time';
import { formatNotificationInboxClockTime } from '@/lib/notifications/notification-relative-time';
import { NotificationInboxLoadMoreSentinel } from './NotificationInboxLoadMoreSentinel';
import { NotificationInboxRow } from './NotificationInboxRow';
import {
  NOTIFICATION_INBOX_BODY_CLASS,
  NOTIFICATION_INBOX_HEADER_ACTION_CLASS,
  NOTIFICATION_INBOX_HEADER_ACTIONS_CLASS,
  NOTIFICATION_INBOX_HEADER_CLASS,
  NOTIFICATION_INBOX_LIST_CLASS,
  NOTIFICATION_INBOX_SETTINGS_BUTTON_CLASS,
  NOTIFICATION_INBOX_SHEET_CONTENT_CLASS,
  NOTIFICATION_INBOX_SHEET_RAIL_ANCHOR_CLASS,
  NOTIFICATION_INBOX_STATUS_CLASS,
  NOTIFICATION_INBOX_TITLE_CLASS,
} from './notification-inbox-sheet-classes';

export interface NotificationInboxSheetProps {
  open: boolean;
  employeeId: string | undefined;
  items: NotificationDto[];
  unreadCount: number;
  listLoading: boolean;
  listLoadingMore: boolean;
  listError: boolean;
  hasMore: boolean;
  locale: string;
  onRowOpen: (notification: NotificationDto) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
  onOpenCenter: () => void;
}

export function NotificationInboxSheet({
  open,
  employeeId,
  items,
  unreadCount,
  listLoading,
  listLoadingMore,
  listError,
  hasMore,
  locale,
  onRowOpen,
  onMarkAllRead,
  onLoadMore,
  onOpenCenter,
}: NotificationInboxSheetProps) {
  return (
    <EntityDetailSheetContent
      open={open}
      layout="auxiliary"
      contentClassName={NOTIFICATION_INBOX_SHEET_CONTENT_CLASS}
      railAnchorClassName={NOTIFICATION_INBOX_SHEET_RAIL_ANCHOR_CLASS}
    >
      <NotificationInboxSheetHeader
        employeeId={employeeId}
        unreadCount={unreadCount}
        onMarkAllRead={onMarkAllRead}
        onOpenCenter={onOpenCenter}
      />
      <div className={NOTIFICATION_INBOX_BODY_CLASS}>
        <NotificationInboxSheetBody
          employeeId={employeeId}
          items={items}
          listLoading={listLoading}
          listLoadingMore={listLoadingMore}
          listError={listError}
          hasMore={hasMore}
          locale={locale}
          onRowOpen={onRowOpen}
          onLoadMore={onLoadMore}
        />
      </div>
    </EntityDetailSheetContent>
  );
}

function NotificationInboxSheetHeader({
  employeeId,
  unreadCount,
  onMarkAllRead,
  onOpenCenter,
}: Pick<
  NotificationInboxSheetProps,
  'employeeId' | 'unreadCount' | 'onMarkAllRead' | 'onOpenCenter'
>) {
  const t = useTranslations('notifications');

  return (
    <SheetHeader className={NOTIFICATION_INBOX_HEADER_CLASS}>
      <div className="min-w-0 flex-1">
        <SheetTitle className={NOTIFICATION_INBOX_TITLE_CLASS}>{t('title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('title')}</SheetDescription>
      </div>
      <div className={NOTIFICATION_INBOX_HEADER_ACTIONS_CLASS}>
        {employeeId && unreadCount > 0 ? (
          <button
            type="button"
            className={NOTIFICATION_INBOX_HEADER_ACTION_CLASS}
            onClick={onMarkAllRead}
          >
            {t('markAllRead')}
          </button>
        ) : null}
        <Link
          href="/notifications"
          className={NOTIFICATION_INBOX_SETTINGS_BUTTON_CLASS}
          onClick={onOpenCenter}
          aria-label={t('openCenter')}
        >
          <Settings size={18} aria-hidden />
        </Link>
      </div>
    </SheetHeader>
  );
}

function NotificationInboxSheetBody({
  employeeId,
  items,
  listLoading,
  listLoadingMore,
  listError,
  hasMore,
  locale,
  onRowOpen,
  onLoadMore,
}: Pick<
  NotificationInboxSheetProps,
  | 'employeeId'
  | 'items'
  | 'listLoading'
  | 'listLoadingMore'
  | 'listError'
  | 'hasMore'
  | 'locale'
  | 'onRowOpen'
  | 'onLoadMore'
>) {
  const t = useTranslations('notifications');

  if (!employeeId) {
    return <p className={NOTIFICATION_INBOX_STATUS_CLASS}>{t('signIn')}</p>;
  }
  if (listLoading) {
    return <p className={NOTIFICATION_INBOX_STATUS_CLASS}>{t('loading')}</p>;
  }
  if (listError) {
    return <p className={NOTIFICATION_INBOX_STATUS_CLASS}>{t('loadFailed')}</p>;
  }
  if (items.length === 0) {
    return <p className={NOTIFICATION_INBOX_STATUS_CLASS}>{t('empty')}</p>;
  }

  return (
    <div className={NOTIFICATION_INBOX_LIST_CLASS}>
      {items.map((notification) => (
        <NotificationInboxRow
          key={notification.id}
          notification={notification}
          relativeLabel={inboxRowRelativeLabel(notification.createdAt, locale, t)}
          clockLabel={formatNotificationInboxClockTime(notification.createdAt, locale)}
          onOpen={onRowOpen}
        />
      ))}
      <NotificationInboxLoadMoreSentinel
        enabled={hasMore}
        loading={listLoadingMore}
        onVisible={onLoadMore}
      />
      {listLoadingMore ? (
        <p className="text-muted-foreground py-2 text-center text-xs">{t('loading')}</p>
      ) : null}
    </div>
  );
}

function inboxRowRelativeLabel(
  createdAt: string,
  locale: string,
  t: ReturnType<typeof useTranslations<'notifications'>>,
): string {
  return formatNotificationInboxTime(createdAt, locale, {
    justNow: t('relative.justNow'),
    minutesAgo: (count) => t('relative.minutesAgo', { count }),
    hoursAgo: (count) => t('relative.hoursAgo', { count }),
    yesterday: t('relative.yesterday'),
    daysAgo: (count) => t('relative.daysAgo', { count }),
  });
}
