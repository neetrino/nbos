export const NOTIFICATION_PREFERENCE_CHANNELS = [
  { id: 'IN_APP', labelKey: 'center.channel.web' },
  { id: 'EMAIL', labelKey: 'center.channel.email' },
  { id: 'TELEGRAM', labelKey: 'center.channel.telegram' },
  { id: 'WHATSAPP', labelKey: 'center.channel.whatsapp' },
] as const;

export type NotificationPreferenceChannelId =
  (typeof NOTIFICATION_PREFERENCE_CHANNELS)[number]['id'];

export type NotificationPreferenceChannelLabelKey =
  (typeof NOTIFICATION_PREFERENCE_CHANNELS)[number]['labelKey'];

const FALLBACK_CHANNEL = 'IN_APP';

export function isNotificationPreferenceChannelOn(
  enabled: boolean,
  channels: readonly string[],
  channelId: string,
): boolean {
  return enabled && channels.includes(channelId);
}

export function nextNotificationPreferenceState(
  pref: { enabled: boolean; channels: readonly string[] },
  channelId: string,
): { enabled: boolean; channels: string[] } {
  const isOn = isNotificationPreferenceChannelOn(pref.enabled, pref.channels, channelId);
  if (isOn) {
    const remaining = pref.channels.filter((channel) => channel !== channelId);
    if (remaining.length === 0) {
      return { enabled: false, channels: [FALLBACK_CHANNEL] };
    }
    return { enabled: true, channels: remaining };
  }
  const channels = pref.channels.includes(channelId)
    ? [...pref.channels]
    : [...pref.channels, channelId];
  return { enabled: true, channels };
}
