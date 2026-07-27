import { describe, expect, it } from 'vitest';
import {
  isNotificationBulkWriteEnabled,
  isNotificationCommandV2Enabled,
  isNotificationEnqueueReconcileEnabled,
  isNotificationSseFromInboxStateEnabled,
  resolveNotificationBatchConcurrency,
  resolveNotificationBatchSize,
} from './notification-command.flags';

describe('notification-command.flags', () => {
  it('defaults all command flags to false', () => {
    const env = {};
    expect(isNotificationCommandV2Enabled(env)).toBe(false);
    expect(isNotificationBulkWriteEnabled(env)).toBe(false);
    expect(isNotificationSseFromInboxStateEnabled(env)).toBe(false);
    expect(isNotificationEnqueueReconcileEnabled(env)).toBe(false);
  });

  it('parses batch bounds', () => {
    expect(resolveNotificationBatchSize({})).toBe(200);
    expect(resolveNotificationBatchConcurrency({})).toBe(4);
    expect(resolveNotificationBatchSize({ NOTIFICATION_BATCH_SIZE: '50' })).toBe(50);
  });

  it('rejects invalid batch size', () => {
    expect(() => resolveNotificationBatchSize({ NOTIFICATION_BATCH_SIZE: '0' })).toThrow();
    expect(() =>
      resolveNotificationBatchConcurrency({ NOTIFICATION_BATCH_CONCURRENCY: 'abc' }),
    ).toThrow();
  });
});
