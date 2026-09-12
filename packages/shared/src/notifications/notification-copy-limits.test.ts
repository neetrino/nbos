import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_BODY_MAX_CHARS,
  NOTIFICATION_TITLE_MAX_CHARS,
  clampNotificationBody,
  clampNotificationCopy,
  clampNotificationFields,
  clampNotificationTitle,
} from './notification-copy-limits';

describe('notification copy limits', () => {
  it('keeps short copy unchanged after whitespace collapse', () => {
    expect(clampNotificationTitle('  Review requested: T-1  ')).toBe('Review requested: T-1');
    expect(clampNotificationBody('Pay now board')).toBe('Pay now board');
  });

  it('cuts title and body to one-line budgets', () => {
    const title = clampNotificationTitle('A'.repeat(NOTIFICATION_TITLE_MAX_CHARS + 20));
    const body = clampNotificationBody('B'.repeat(NOTIFICATION_BODY_MAX_CHARS + 40));
    expect(title.length).toBe(NOTIFICATION_TITLE_MAX_CHARS);
    expect(body.length).toBe(NOTIFICATION_BODY_MAX_CHARS);
    expect(title.endsWith('…')).toBe(true);
    expect(body.endsWith('…')).toBe(true);
  });

  it('collapses a dump onto one line before cutting', () => {
    const clamped = clampNotificationCopy('Invoice\ncard\n\nFAILED. Error: Prisma…', 24);
    expect(clamped.includes('\n')).toBe(false);
    expect(clamped.length).toBeLessThanOrEqual(24);
  });

  it('clamps title and body together', () => {
    const next = clampNotificationFields({
      title: 'T'.repeat(90),
      body: 'Body\nwith\nbreaks',
      keep: true,
    });
    expect(next.title.length).toBe(NOTIFICATION_TITLE_MAX_CHARS);
    expect(next.body).toBe('Body with breaks');
    expect(next.keep).toBe(true);
  });
});
