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

export function nextNotificationPreferenceChannels(
  channels: readonly string[],
  channelId: string,
  turnOn: boolean,
): string[] {
  if (turnOn) {
    return channels.includes(channelId) ? [...channels] : [...channels, channelId];
  }
  const next = channels.filter((channel) => channel !== channelId);
  return next.length > 0 ? next : [FALLBACK_CHANNEL];
}
