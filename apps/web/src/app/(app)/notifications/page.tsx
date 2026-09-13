'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHero } from '@/components/shared';
import { NotificationCenterPreferences } from '@/features/notifications/NotificationCenterPreferences';
import { NOTIFICATION_CENTER_PAGE_CLASS } from '@/features/notifications/notification-center-classes';
import type { NotificationPreferenceDto } from '@/lib/api/notifications';
import { notificationsApi } from '@/lib/api/notifications';
import { nextNotificationPreferenceState } from '@/lib/notifications/notification-preference-channels';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const [preferences, setPreferences] = useState<NotificationPreferenceDto[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(true);

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

  async function togglePreferenceChannel(row: NotificationPreferenceDto, channel: string) {
    const next = nextNotificationPreferenceState(row, channel);
    setPreferences((current) =>
      current.map((it) => (it.eventType === row.eventType ? { ...it, ...next } : it)),
    );
    try {
      await notificationsApi.patchPreference(row.eventType, next);
    } catch {
      setPreferences((current) => current.map((it) => (it.eventType === row.eventType ? row : it)));
    }
  }

  return (
    <div className={NOTIFICATION_CENTER_PAGE_CLASS}>
      <PageHero title={t('center.prefsTitle')} />
      <p className="text-muted-foreground text-sm">{t('center.prefsDescription')}</p>
      <NotificationCenterPreferences
        preferences={preferences}
        loading={prefsLoading}
        onToggleChannel={(row, channel) => void togglePreferenceChannel(row, channel)}
      />
    </div>
  );
}
