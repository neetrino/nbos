import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  isNotificationInboxStateReadEnabled,
  isNotificationInboxStateWriteEnabled,
  isNotificationInboxStateReconcileEnabled,
  isNotificationInboxStateShadowReadEnabled,
  resolveInboxShadowReadSampleRate,
} from './notification-inbox-state.flags';

describe('notification-inbox-state.flags', () => {
  const keys = [
    'NOTIFICATION_INBOX_STATE_WRITE_ENABLED',
    'NOTIFICATION_INBOX_STATE_READ_ENABLED',
    'NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED',
    'NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED',
    'NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE',
  ] as const;
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of keys) {
      prev[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  });

  it('defaults all flags to false', () => {
    expect(isNotificationInboxStateWriteEnabled()).toBe(false);
    expect(isNotificationInboxStateReadEnabled()).toBe(false);
    expect(isNotificationInboxStateReconcileEnabled()).toBe(false);
    expect(isNotificationInboxStateShadowReadEnabled()).toBe(false);
  });

  it('parses truthy values and sample rate', () => {
    process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED = 'true';
    process.env.NOTIFICATION_INBOX_STATE_READ_ENABLED = '1';
    process.env.NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED = 'yes';
    process.env.NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED = 'true';
    process.env.NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE = '0.05';
    expect(isNotificationInboxStateWriteEnabled()).toBe(true);
    expect(isNotificationInboxStateReadEnabled()).toBe(true);
    expect(isNotificationInboxStateReconcileEnabled()).toBe(true);
    expect(isNotificationInboxStateShadowReadEnabled()).toBe(true);
    expect(resolveInboxShadowReadSampleRate()).toBe(0.05);
  });

  it('rejects invalid sample rate', () => {
    process.env.NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE = '2';
    expect(() => resolveInboxShadowReadSampleRate()).toThrow();
  });
});
