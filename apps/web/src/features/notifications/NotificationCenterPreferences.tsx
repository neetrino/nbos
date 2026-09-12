'use client';

import { useTranslations } from 'next-intl';
import type { NotificationPreferenceDto } from '@/lib/api/notifications';
import {
  humanizeNotificationEventType,
  resolveNotificationEventTypeMessageKey,
} from '@/lib/notifications/notification-event-type-labels';
import {
  isNotificationPreferenceChannelOn,
  NOTIFICATION_PREFERENCE_CHANNELS,
} from '@/lib/notifications/notification-preference-channels';
import {
  NOTIFICATION_CENTER_CHIP_BASE_CLASS,
  NOTIFICATION_CENTER_CHIP_OFF_CLASS,
  NOTIFICATION_CENTER_CHIP_ON_CLASS,
  NOTIFICATION_CENTER_PREF_ROW_CLASS,
  NOTIFICATION_CENTER_SECTION_CLASS,
} from './notification-center-classes';

export interface NotificationCenterPreferencesProps {
  preferences: NotificationPreferenceDto[];
  loading: boolean;
  onToggleChannel: (row: NotificationPreferenceDto, channel: string) => void;
}

export function NotificationCenterPreferences({
  preferences,
  loading,
  onToggleChannel,
}: NotificationCenterPreferencesProps) {
  const t = useTranslations('notifications');

  return (
    <section className={NOTIFICATION_CENTER_SECTION_CLASS}>
      {loading ? (
        <p className="text-muted-foreground text-sm">{t('center.prefsLoading')}</p>
      ) : (
        <div className="space-y-2">
          {preferences.map((pref) => (
            <div key={pref.eventType} className={NOTIFICATION_CENTER_PREF_ROW_CLASS}>
              <p className="text-foreground min-w-0 flex-1 text-sm font-medium">
                {preferenceTitle(pref.eventType, t)}
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {NOTIFICATION_PREFERENCE_CHANNELS.map((channel) => {
                  const on = isNotificationPreferenceChannelOn(
                    pref.enabled,
                    pref.channels,
                    channel.id,
                  );
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => onToggleChannel(pref, channel.id)}
                      className={`${NOTIFICATION_CENTER_CHIP_BASE_CLASS} ${
                        on
                          ? NOTIFICATION_CENTER_CHIP_ON_CLASS
                          : NOTIFICATION_CENTER_CHIP_OFF_CLASS
                      }`}
                    >
                      {t(channel.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function preferenceTitle(
  eventType: string,
  t: ReturnType<typeof useTranslations<'notifications'>>,
): string {
  const key = resolveNotificationEventTypeMessageKey(eventType);
  return key ? t(key) : humanizeNotificationEventType(eventType);
}
