import { describe, expect, it } from 'vitest';
import {
  isNotificationPreferenceChannelOn,
  nextNotificationPreferenceState,
} from './notification-preference-channels';

describe('notification preference channels', () => {
  it('treats Web as on only when the row is enabled and IN_APP is selected', () => {
    expect(isNotificationPreferenceChannelOn(true, ['IN_APP', 'EMAIL'], 'IN_APP')).toBe(true);
    expect(isNotificationPreferenceChannelOn(false, ['IN_APP'], 'IN_APP')).toBe(false);
  });

  it('turns the last channel off by disabling the row', () => {
    expect(nextNotificationPreferenceState({ enabled: true, channels: ['IN_APP'] }, 'IN_APP')).toEqual({
      enabled: false,
      channels: ['IN_APP'],
    });
  });

  it('turns Web on and re-enables the row', () => {
    expect(
      nextNotificationPreferenceState({ enabled: false, channels: ['IN_APP'] }, 'IN_APP'),
    ).toEqual({
      enabled: true,
      channels: ['IN_APP'],
    });
  });
});
