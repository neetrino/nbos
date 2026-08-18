import { describe, expect, it, vi } from 'vitest';
import { applyMailSyncFailure } from './mail-sync-failure.ops';

function createPrisma() {
  return {
    mailAccount: { update: vi.fn(), updateMany: vi.fn() },
    mailProviderConnection: { update: vi.fn(), updateMany: vi.fn() },
    mailSyncLog: { create: vi.fn() },
  };
}

describe('applyMailSyncFailure', () => {
  it('classifies auth errors as NEEDS_RECONNECT and completes the job', async () => {
    const prisma = createPrisma();
    const outcome = await applyMailSyncFailure(prisma as never, 'a1', {
      status: 401,
      message: 'invalid_grant',
    });
    expect(outcome).toBe('complete');
    expect(prisma.mailAccount.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'NEEDS_RECONNECT' }) }),
    );
    expect(prisma.mailProviderConnection.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'NEEDS_RECONNECT' }) }),
    );
    expect(prisma.mailSyncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kind: 'RECONNECT_REQUIRED' }) }),
    );
  });

  it('marks DEGRADED and asks the worker to retry on transient errors', async () => {
    const prisma = createPrisma();
    const error = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    const outcome = await applyMailSyncFailure(prisma as never, 'a1', error);
    expect(outcome).toBe('retry');
    expect(prisma.mailAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DEGRADED' }) }),
    );
  });
});
