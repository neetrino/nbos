'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import { usePermission } from '@/lib/permissions';
import type { NotificationDto } from '@/lib/api/notifications';
import { notificationsApi } from '@/lib/api/notifications';
import { getNotificationVisual } from '@/lib/notifications/notification-type-visual';
import {
  classifyNotificationAge,
  formatNotificationAbsoluteDate,
} from '@/lib/notifications/notification-relative-time';
import { useNotificationFeed } from '@/lib/notifications/use-notification-feed';

function formatNotificationInboxTime(
  dateStr: string,
  locale: string,
  t: ReturnType<typeof useTranslations<'notifications'>>,
): string {
  const kind = classifyNotificationAge(dateStr);
  if (kind.type === 'justNow') return t('relative.justNow');
  if (kind.type === 'minutes') return t('relative.minutesAgo', { count: kind.count });
  if (kind.type === 'hours') return t('relative.hoursAgo', { count: kind.count });
  if (kind.type === 'yesterday') return t('relative.yesterday');
  if (kind.type === 'days') return t('relative.daysAgo', { count: kind.count });
  return formatNotificationAbsoluteDate(dateStr, locale);
}

export function NotificationDropdown() {
  const { me } = usePermission();
  const employeeId = me?.id;
  const tNav = useTranslations('navigation');
  const t = useTranslations('notifications');
  const locale = resolveDatePickerLocale(useLocale());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function onRowOpen(n: NotificationDto) {
    if (employeeId && !n.isRead) {
      try {
        await notificationsApi.markAsRead(n.id);
        applyLocalRead(n.id);
      } catch {
        /* still follow link */
      }
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:bg-secondary hover:text-foreground relative rounded-lg p-2 transition-colors"
        aria-label={tNav('notifications.trigger')}
      >
        <Bell size={20} />
        {employeeId && unreadCount > 0 && (
          <span className="bg-accent text-accent-foreground absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="border-border bg-card absolute top-full right-0 z-40 mt-2 w-80 rounded-2xl border shadow-xl">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-semibold">{t('title')}</h3>
            {employeeId && unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-accent hover:text-accent/80 text-xs font-medium transition-colors"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!employeeId && (
              <p className="text-muted-foreground px-4 py-6 text-center text-xs">
                {t('signIn')}
              </p>
            )}
            {employeeId && listLoading && (
              <p className="text-muted-foreground px-4 py-6 text-center text-xs">{t('loading')}</p>
            )}
            {employeeId && listError && (
              <p className="text-muted-foreground px-4 py-6 text-center text-xs">
                {t('loadFailed')}
              </p>
            )}
            {employeeId && !listLoading && !listError && items.length === 0 && (
              <p className="text-muted-foreground px-4 py-6 text-center text-xs">
                {t('empty')}
              </p>
            )}
            {employeeId &&
              !listLoading &&
              !listError &&
              items.map((n) => {
                const { Icon, iconClassName } = getNotificationVisual(n.type);
                const inner = (
                  <>
                    <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${iconClassName}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground truncate text-xs font-medium">{n.title}</p>
                        {!n.isRead && (
                          <span className="bg-accent h-1.5 w-1.5 shrink-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {formatNotificationInboxTime(n.createdAt, locale, t)}
                      </p>
                    </div>
                  </>
                );
                const rowClass = `hover:bg-secondary/50 flex w-full gap-3 px-4 py-3 transition-colors ${
                  !n.isRead ? 'bg-secondary/30' : ''
                }`;
                if (n.link) {
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      className={rowClass}
                      onClick={() => void onRowOpen(n)}
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={rowClass}
                    onClick={() => void onRowOpen(n)}
                  >
                    {inner}
                  </button>
                );
              })}
            {employeeId && !listLoading && !listError && hasMore && (
              <button
                type="button"
                className="text-accent hover:bg-secondary/50 w-full px-4 py-2.5 text-center text-xs font-medium transition-colors"
                disabled={listLoadingMore}
                onClick={() => void loadMore()}
              >
                {listLoadingMore ? t('loading') : t('loadMore')}
              </button>
            )}
          </div>

          <div className="border-border border-t px-4 py-2.5 text-center">
            <Link
              href="/notifications"
              className="text-accent hover:text-accent/80 text-xs font-medium"
            >
              {t('openCenter')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
