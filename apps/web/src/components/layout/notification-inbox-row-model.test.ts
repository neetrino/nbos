import { describe, expect, it } from 'vitest';
import { NOTIFICATION_BODY_MAX_CHARS, NOTIFICATION_TITLE_MAX_CHARS } from '@nbos/shared';
import { resolveNotificationInboxRowModel } from './notification-inbox-row-model';
import { NOTIFICATION_INBOX_ROW_UNREAD_CLASS } from './notification-inbox-sheet-classes';

describe('resolveNotificationInboxRowModel', () => {
  it('exposes title, body, and unread surface', () => {
    const model = resolveNotificationInboxRowModel({
      title: 'Review requested: T-2026-03888',
      body: 'Pay now board — list view',
      isRead: false,
      link: '/tasks?openTaskId=1',
    });

    expect(model.title).toBe('Review requested: T-2026-03888');
    expect(model.body).toBe('Pay now board — list view');
    expect(model.unread).toBe(true);
    expect(model.href).toBe('/tasks?openTaskId=1');
    expect(model.surfaceClassName).toContain(NOTIFICATION_INBOX_ROW_UNREAD_CLASS);
  });

  it('omits the unread tint when the item is read', () => {
    const model = resolveNotificationInboxRowModel({
      title: 'Mail queued',
      body: 'Outbound sent',
      isRead: true,
      link: null,
    });

    expect(model.unread).toBe(false);
    expect(model.href).toBeNull();
    expect(model.surfaceClassName).not.toContain(NOTIFICATION_INBOX_ROW_UNREAD_CLASS);
  });

  it('shortens long title and body to the one-line budget', () => {
    const model = resolveNotificationInboxRowModel({
      title: 'Scheduler failed: Invoice card reminders and a very long suffix',
      body: 'Invoice card reminders ended as FAILED. Error: PrismaClientValidationError dump',
      isRead: true,
      link: null,
    });

    expect(model.title.length).toBeLessThanOrEqual(NOTIFICATION_TITLE_MAX_CHARS);
    expect(model.body.length).toBeLessThanOrEqual(NOTIFICATION_BODY_MAX_CHARS);
    expect(model.body.includes('\n')).toBe(false);
  });
});
