import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from './notification.service';
import { resetInboxMetrics, getInboxMetrics } from './notification-inbox-metrics';

describe('NotificationService getUnreadCount READ/shadow', () => {
  const prev: Record<string, string | undefined> = {};
  const keys = [
    'NOTIFICATION_INBOX_STATE_READ_ENABLED',
    'NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED',
    'NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE',
  ] as const;

  beforeEach(() => {
    for (const key of keys) {
      prev[key] = process.env[key];
      delete process.env[key];
    }
    resetInboxMetrics();
  });

  afterEach(() => {
    for (const key of keys) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  });

  it('READ=false uses legacy COUNT', async () => {
    const count = vi.fn(async () => 3);
    const prisma = {
      inAppNotification: { count },
      $queryRaw: vi.fn(),
      $transaction: vi.fn(),
    };
    const service = new NotificationService(prisma as never);
    const result = await service.getUnreadCount('u1');
    expect(result).toEqual({ count: 3, source: 'legacy_count' });
    expect(count).toHaveBeenCalledTimes(1);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('READ=true uses InboxState without COUNT when present', async () => {
    process.env.NOTIFICATION_INBOX_STATE_READ_ENABLED = 'true';
    const count = vi.fn();
    const prisma = {
      inAppNotification: { count },
      $queryRaw: vi.fn(async () => [{ unread_count: 7, version: 42n }]),
      $transaction: vi.fn(),
    };
    const service = new NotificationService(prisma as never);
    const result = await service.getUnreadCount('u1');
    expect(result).toEqual({ count: 7, version: 42, source: 'inbox_state' });
    expect(count).not.toHaveBeenCalled();
  });

  it('READ=true missing state repairs via COUNT fallback (not false 0)', async () => {
    process.env.NOTIFICATION_INBOX_STATE_READ_ENABLED = 'true';
    const prisma = {
      inAppNotification: { count: vi.fn() },
      $queryRaw: vi.fn(async () => []),
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => {
        const tx = {
          $executeRaw: vi.fn(async () => 0),
          inAppNotification: { count: vi.fn(async () => 4) },
          $queryRaw: vi.fn(async () => [{ unread_count: 4, version: 1n }]),
        };
        return fn(tx);
      },
    };
    const service = new NotificationService(prisma as never);
    const result = await service.getUnreadCount('u1');
    expect(result.count).toBe(4);
    expect(result.version).toBe(1);
    expect(result.source).toBe('inbox_state');
    expect(getInboxMetrics().notification_inbox_missing_state_total).toBe(1);
    expect(getInboxMetrics().notification_inbox_read_fallback_total).toBe(1);
  });

  it('shadow mismatch does not change response', async () => {
    process.env.NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED = 'true';
    process.env.NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE = '1';
    const prisma = {
      inAppNotification: { count: vi.fn(async () => 2) },
      $queryRaw: vi.fn(async () => [{ unread_count: 9, version: 3n }]),
      $transaction: vi.fn(),
    };
    const service = new NotificationService(prisma as never);
    const result = await service.getUnreadCount('u1');
    expect(result).toEqual({ count: 2, source: 'legacy_count' });
    expect(getInboxMetrics().notification_inbox_shadow_mismatch_total).toBe(1);
  });
});
