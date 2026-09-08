import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fillCredentialContextIfEmpty, resolveExpenseCredentialId } from './expense-credential-link';

describe('resolveExpenseCredentialId', () => {
  const prisma = {
    credential: { findUnique: vi.fn(), update: vi.fn() },
    expensePlan: { findUnique: vi.fn() },
    clientServiceRecord: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    prisma.credential.findUnique.mockReset();
    prisma.credential.update.mockReset();
    prisma.expensePlan.findUnique.mockReset();
    prisma.clientServiceRecord.findUnique.mockReset();
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-1',
      productId: null,
      clientServiceRecordId: null,
      trashedAt: null,
    });
  });

  it('resolves from plan credential', async () => {
    prisma.expensePlan.findUnique.mockResolvedValue({ credentialId: 'cred-1' });
    await expect(
      resolveExpenseCredentialId(prisma as never, { expensePlanId: 'plan-1' }),
    ).resolves.toBe('cred-1');
  });

  it('resolves from client service provider account', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue({ providerAccountId: 'cred-1' });
    await expect(
      resolveExpenseCredentialId(prisma as never, { clientServiceRecordId: 'csr-1' }),
    ).resolves.toBe('cred-1');
  });

  it('rejects conflicting credentials', async () => {
    prisma.expensePlan.findUnique.mockResolvedValue({ credentialId: 'cred-plan' });
    await expect(
      resolveExpenseCredentialId(prisma as never, {
        credentialId: 'cred-other',
        expensePlanId: 'plan-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns null when nothing is linked', async () => {
    await expect(resolveExpenseCredentialId(prisma as never, {})).resolves.toBeNull();
  });

  it('rejects a trashed credential', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-1',
      productId: null,
      clientServiceRecordId: null,
      trashedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    await expect(
      resolveExpenseCredentialId(prisma as never, { credentialId: 'cred-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('fillCredentialContextIfEmpty', () => {
  const prisma = {
    credential: { findUnique: vi.fn(), update: vi.fn() },
    expensePlan: { findUnique: vi.fn() },
    clientServiceRecord: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    prisma.credential.findUnique.mockReset();
    prisma.credential.update.mockReset();
  });

  it('fills empty product and service ids', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-1',
      productId: null,
      clientServiceRecordId: null,
      trashedAt: null,
    });

    await fillCredentialContextIfEmpty(prisma as never, 'cred-1', {
      productId: 'prod-1',
      clientServiceRecordId: 'csr-1',
    });

    expect(prisma.credential.update).toHaveBeenCalledWith({
      where: { id: 'cred-1' },
      data: { productId: 'prod-1', clientServiceRecordId: 'csr-1' },
    });
  });

  it('does not overwrite existing context', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-1',
      productId: 'prod-old',
      clientServiceRecordId: 'csr-old',
      trashedAt: null,
    });

    await fillCredentialContextIfEmpty(prisma as never, 'cred-1', {
      productId: 'prod-1',
      clientServiceRecordId: 'csr-1',
    });

    expect(prisma.credential.update).not.toHaveBeenCalled();
  });
});
