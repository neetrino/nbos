import type { PrismaClient } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';
import { recordMailAccountSyncStubOp } from './mail-account-sync-stub.ops';

describe('recordMailAccountSyncStubOp', () => {
  it('returns ok when findFirst and update succeed', async () => {
    const updated = { id: 'a1', emailAddress: 'x@test.com' };
    const prisma = {
      mailAccount: {
        findFirst: vi.fn().mockResolvedValue({ id: 'a1' }),
        update: vi.fn().mockResolvedValue(updated),
      },
    } as unknown as InstanceType<typeof PrismaClient>;
    const r = await recordMailAccountSyncStubOp(prisma, {
      employeeId: 'e1',
      accessScope: 'OWN',
      accountId: 'a1',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.account).toEqual(updated);
    }
  });

  it('returns not ok when account not visible', async () => {
    const update = vi.fn();
    const prisma = {
      mailAccount: {
        findFirst: vi.fn().mockResolvedValue(null),
        update,
      },
    } as unknown as InstanceType<typeof PrismaClient>;
    const r = await recordMailAccountSyncStubOp(prisma, {
      employeeId: 'e1',
      accessScope: 'OWN',
      accountId: 'missing',
    });
    expect(r.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
