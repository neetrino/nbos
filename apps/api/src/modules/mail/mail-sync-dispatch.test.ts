import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { dispatchManualMailSync, enqueueMailSyncBestEffort } from './mail-sync-dispatch';

describe('mail sync dispatch', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('does not inline sync in production when enqueue fails', async () => {
    process.env.NODE_ENV = 'production';
    const syncAccount = vi.fn();
    await expect(
      dispatchManualMailSync({
        queue: { enqueueSync: vi.fn().mockResolvedValue(false) } as never,
        syncService: { syncAccount } as never,
        logger: { warn: vi.fn() } as unknown as Logger,
        mailAccountId: 'a1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(syncAccount).not.toHaveBeenCalled();
  });

  it('does not inline Pub/Sub enqueue miss in production', async () => {
    process.env.NODE_ENV = 'production';
    const syncAccount = vi.fn();
    const queued = await enqueueMailSyncBestEffort({
      queue: { enqueueSync: vi.fn().mockResolvedValue(false) } as never,
      syncService: { syncAccount } as never,
      logger: { warn: vi.fn() } as unknown as Logger,
      mailAccountId: 'a1',
    });
    expect(queued).toBe(false);
    expect(syncAccount).not.toHaveBeenCalled();
  });

  it('uses inline fallback outside production and logs mail.inline_fallback', async () => {
    process.env.NODE_ENV = 'development';
    const syncAccount = vi.fn();
    const warn = vi.fn();
    await dispatchManualMailSync({
      queue: { enqueueSync: vi.fn().mockResolvedValue(false) } as never,
      syncService: { syncAccount } as never,
      logger: { warn } as unknown as Logger,
      mailAccountId: 'a1',
    });
    expect(syncAccount).toHaveBeenCalledWith('a1');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(MAIL_INLINE_FALLBACK_LOG));
  });
});
