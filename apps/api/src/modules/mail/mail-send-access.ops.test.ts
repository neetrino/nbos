import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { requireMailAccountSendRole } from './mail-send-access.ops';

const ACCOUNT = {
  id: 'acc-1',
  emailAddress: 'team@example.com',
  displayName: null,
  ownerEmployeeId: 'owner-1',
  providerType: 'GMAIL',
};

function mockPrisma(accessRole: string | null) {
  return {
    mailAccount: {
      findUnique: vi.fn().mockResolvedValue(ACCOUNT),
    },
    mailAccountAccess: {
      findUnique: vi.fn().mockResolvedValue(accessRole ? { role: accessRole } : null),
    },
  } as never;
}

describe('requireMailAccountSendRole', () => {
  const params = { mailAccountId: 'acc-1', employeeId: 'emp-1', viewScope: 'OWN' };

  it('allows SENDER delegated access', async () => {
    await expect(requireMailAccountSendRole(mockPrisma('SENDER'), params)).resolves.toBeUndefined();
  });

  it('allows mailbox owner', async () => {
    const prisma = {
      mailAccount: {
        findUnique: vi.fn().mockResolvedValue({ ...ACCOUNT, ownerEmployeeId: 'emp-1' }),
      },
      mailAccountAccess: { findUnique: vi.fn() },
    } as never;
    await expect(requireMailAccountSendRole(prisma, params)).resolves.toBeUndefined();
  });

  it('rejects READER with ForbiddenException', async () => {
    await expect(requireMailAccountSendRole(mockPrisma('READER'), params)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects when viewer has no mailbox role', async () => {
    const prisma = {
      mailAccount: { findUnique: vi.fn().mockResolvedValue(ACCOUNT) },
      mailAccountAccess: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never;
    await expect(requireMailAccountSendRole(prisma, params)).rejects.toThrow(ForbiddenException);
  });
});
