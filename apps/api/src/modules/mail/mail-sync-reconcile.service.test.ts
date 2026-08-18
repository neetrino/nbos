import { describe, expect, it, vi } from 'vitest';
import {
  enqueueSyncForActiveMailboxes,
  mailSyncReconcileAccountWhere,
} from './mail-sync-reconcile.ops';
import { MAIL_SYNCABLE_ACCOUNT_STATUSES } from './mail-sync-runtime.constants';

describe('mail sync reconcile', () => {
  it('enqueues only ACTIVE and DEGRADED and skips NEEDS_RECONNECT', async () => {
    const enqueueSync = vi.fn().mockResolvedValue(true);
    const findMany = vi.fn().mockResolvedValue([{ id: 'active-1' }, { id: 'degraded-1' }]);

    const enqueued = await enqueueSyncForActiveMailboxes({
      prisma: { mailAccount: { findMany } } as never,
      enqueueSync,
    });

    expect(mailSyncReconcileAccountWhere()).toEqual({
      status: { in: [...MAIL_SYNCABLE_ACCOUNT_STATUSES] },
    });
    expect(MAIL_SYNCABLE_ACCOUNT_STATUSES).not.toContain('NEEDS_RECONNECT');
    expect(findMany).toHaveBeenCalledWith({
      where: { status: { in: ['ACTIVE', 'DEGRADED'] } },
      select: { id: true },
    });
    expect(enqueueSync).toHaveBeenCalledTimes(2);
    expect(enqueued).toBe(2);
  });
});
