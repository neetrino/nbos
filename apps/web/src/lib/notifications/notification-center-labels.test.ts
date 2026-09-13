import { describe, expect, it } from 'vitest';
import {
  formatNotificationCenterDate,
  localizeNotificationCategory,
  localizeNotificationPriority,
} from './notification-center-labels';

describe('notification-center-labels', () => {
  it('translates known category and priority keys', () => {
    expect(localizeNotificationCategory('action_required', (key) => key)).toBe(
      'category.action_required',
    );
    expect(localizeNotificationPriority('high', (key) => key)).toBe('priority.high');
  });

  it('keeps unknown stored codes', () => {
    expect(localizeNotificationCategory('custom_event', (key) => key)).toBe('custom_event');
    expect(localizeNotificationPriority('urgent', (key) => key)).toBe('urgent');
  });

  it('formats a valid date in the given locale', () => {
    const label = formatNotificationCenterDate('2026-09-12T10:30:00.000Z', 'ru-RU');
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toBe('2026-09-12T10:30:00.000Z');
  });
});
