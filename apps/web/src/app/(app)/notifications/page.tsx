'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import type { NotificationDto, NotificationPreferenceDto } from '@/lib/api/notifications';
import { notificationsApi } from '@/lib/api/notifications';
import {
  formatNotificationCenterDate,
  localizeNotificationCategory,
  localizeNotificationPriority,
  NOTIFICATION_CATEGORY_FILTERS,
  type NotificationCategoryFilter,
} from '@/lib/notifications/notification-center-labels';
import { getNotificationVisual } from '@/lib/notifications/notification-type-visual';

const PAGE_SIZE = 30;

function priorityClass(priority: string): string {
  if (priority === 'critical') return 'border-red-500/40 bg-red-500/10 text-red-700';
  if (priority === 'high') return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
  return 'border-border bg-secondary text-muted-foreground';
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const dateLocale = resolveDatePickerLocale(useLocale());
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [category, setCategory] = useState<NotificationCategoryFilter>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferenceDto[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(true);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await notificationsApi.list({ page: 1, pageSize: PAGE_SIZE, category });
      setItems(result.items);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      setPrefsLoading(true);
      try {
        setPreferences(await notificationsApi.getPreferences());
      } finally {
        setPrefsLoading(false);
      }
    })();
  }, []);

  async function markAllRead() {
    await notificationsApi.markAllAsRead();
    const readAt = new Date().toISOString();
    setItems((current) =>
      current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? readAt })),
    );
  }

  async function markRead(id: string) {
    const updated = await notificationsApi.markAsRead(id);
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  async function archive(id: string) {
    await notificationsApi.archive(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function togglePreferenceEnabled(row: NotificationPreferenceDto) {
    const nextEnabled = !row.enabled;
    setPreferences((current) =>
      current.map((it) => (it.eventType === row.eventType ? { ...it, enabled: nextEnabled } : it)),
    );
    try {
      await notificationsApi.patchPreference(row.eventType, { enabled: nextEnabled });
    } catch {
      setPreferences((current) => current.map((it) => (it.eventType === row.eventType ? row : it)));
    }
  }

  async function togglePreferenceChannel(row: NotificationPreferenceDto, channel: string) {
    const has = row.channels.includes(channel);
    const nextChannels = has
      ? row.channels.filter((c) => c !== channel)
      : [...row.channels, channel];
    const normalizedNext = nextChannels.length ? nextChannels : ['IN_APP'];
    const optimistic = { ...row, channels: normalizedNext };
    setPreferences((current) =>
      current.map((it) => (it.eventType === row.eventType ? optimistic : it)),
    );
    try {
      await notificationsApi.patchPreference(row.eventType, { channels: normalizedNext });
    } catch {
      setPreferences((current) => current.map((it) => (it.eventType === row.eventType ? row : it)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{t('center.kicker')}</p>
          <h1 className="text-foreground text-2xl font-semibold">{t('center.title')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="border-border bg-card text-muted-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          >
            <RefreshCw size={16} />
            {t('center.refresh')}
          </button>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm disabled:cursor-not-allowed"
          >
            <CheckCheck size={16} />
            {t('center.markAllRead')}
          </button>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="flex flex-wrap gap-2">
          {NOTIFICATION_CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setCategory(filter.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === filter.value
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`category.${filter.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="mb-3">
          <h2 className="text-foreground text-sm font-semibold">{t('center.prefsTitle')}</h2>
          <p className="text-muted-foreground text-xs">{t('center.prefsDescription')}</p>
        </div>
        {prefsLoading ? (
          <p className="text-muted-foreground text-sm">{t('center.prefsLoading')}</p>
        ) : (
          <div className="space-y-2">
            {preferences.map((pref) => (
              <div
                key={pref.eventType}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-medium">{pref.eventType}</p>
                  <p className="text-muted-foreground text-xs">
                    {t('center.channels', { list: pref.channels.join(', ') })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void togglePreferenceEnabled(pref)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      pref.enabled
                        ? 'bg-emerald-600/15 text-emerald-700'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {pref.enabled ? t('center.enabled') : t('center.disabled')}
                  </button>
                  {(['IN_APP', 'EMAIL', 'TELEGRAM', 'WHATSAPP'] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => void togglePreferenceChannel(pref, channel)}
                      className={`rounded-full px-3 py-1 text-xs ${
                        pref.channels.includes(channel)
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        {loading && <p className="text-muted-foreground p-6 text-sm">{t('center.loadingList')}</p>}
        {error && <p className="text-muted-foreground p-6 text-sm">{t('loadFailed')}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Bell className="text-muted-foreground" size={28} />
            <div>
              <h2 className="text-foreground text-sm font-medium">{t('center.emptyTitle')}</h2>
              <p className="text-muted-foreground mt-1 text-xs">{t('center.emptyDescription')}</p>
            </div>
          </div>
        )}
        {!loading &&
          !error &&
          items.map((item) => {
            const { Icon, iconClassName } = getNotificationVisual(item.type);
            const content = (
              <div className="flex min-w-0 flex-1 gap-3">
                <div className={`mt-0.5 h-fit rounded-lg p-2 ${iconClassName}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground text-sm font-semibold">{item.title}</h2>
                    {!item.isRead && <span className="bg-accent h-2 w-2 rounded-full" />}
                    <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]">
                      {localizeNotificationCategory(item.category, t)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${priorityClass(item.priority)}`}
                    >
                      {localizeNotificationPriority(item.priority, t)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {formatNotificationCenterDate(item.createdAt, dateLocale)}
                  </p>
                </div>
              </div>
            );

            return (
              <div key={item.id} className="border-border flex gap-3 border-b p-4 last:border-b-0">
                {item.link ? (
                  <Link href={item.link} className="min-w-0 flex-1">
                    {content}
                  </Link>
                ) : (
                  content
                )}
                <div className="flex shrink-0 flex-col gap-2">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      className="text-muted-foreground hover:bg-secondary rounded-lg p-2"
                      aria-label={t('center.markReadAria')}
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void archive(item.id)}
                    className="text-muted-foreground hover:bg-secondary rounded-lg p-2"
                    aria-label={t('center.archiveAria')}
                  >
                    <Archive size={16} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
