import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  completePasswordReset,
  createPasswordResetSecret,
  getPasswordResetInfo,
  hashPasswordResetToken,
  requestPasswordReset,
} from './auth-password-reset';
import { FORGOT_PASSWORD_GENERIC_MESSAGE } from './auth-password-reset.constants';

vi.mock('argon2', () => ({
  verify: vi.fn(),
  hash: vi.fn(),
  argon2id: 2,
}));

vi.mock('./auth-password-reset.email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('password reset', () => {
  const passwordResetToken = {
    findUnique: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
  };
  const employeeFindUnique = vi.fn();
  const employeeUpdate = vi.fn();
  const authSessionUpdateMany = vi.fn();
  const prisma = {
    employee: { findUnique: employeeFindUnique, update: employeeUpdate },
    passwordResetToken,
    authSession: { updateMany: authSessionUpdateMany },
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };
  const logger = { log: vi.fn(), warn: vi.fn() } as unknown as Logger;
  const vaultSession = { lock: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
  });

  it('hashes the raw token and does not store it', () => {
    const { token, tokenHash } = createPasswordResetSecret();
    expect(tokenHash).toBe(hashPasswordResetToken(token));
    expect(tokenHash).not.toBe(token);
  });

  it('returns the same message when the email is unknown', async () => {
    employeeFindUnique.mockResolvedValue(null);
    const result = await requestPasswordReset({
      prisma: prisma as never,
      logger,
      email: 'missing@company.com',
    });
    expect(result.message).toBe(FORGOT_PASSWORD_GENERIC_MESSAGE);
    expect(passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('issues a token for an active employee', async () => {
    employeeFindUnique.mockResolvedValue({
      id: 'e1',
      email: 'owner@company.com',
      passwordHash: 'hash',
      status: 'ACTIVE',
    });

    const result = await requestPasswordReset({
      prisma: prisma as never,
      logger,
      email: 'Owner@company.com',
    });

    expect(result.message).toBe(FORGOT_PASSWORD_GENERIC_MESSAGE);
    expect(passwordResetToken.deleteMany).toHaveBeenCalled();
    expect(passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ employeeId: 'e1', tokenHash: expect.any(String) }),
      }),
    );
  });

  it('rejects an expired or used token', async () => {
    passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(
      getPasswordResetInfo({ prisma: prisma as never, token: 'nope' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates the hash, revokes sessions, and consumes the token', async () => {
    passwordResetToken.findUnique.mockResolvedValue({
      id: 't1',
      employeeId: 'e1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      employee: { email: 'owner@company.com', passwordHash: 'old-hash', status: 'ACTIVE' },
    });
    vi.mocked(argon2.verify).mockResolvedValue(false);
    vi.mocked(argon2.hash).mockResolvedValue('new-hash');

    const result = await completePasswordReset({
      prisma: prisma as never,
      vaultSession,
      logger,
      token: 'raw-token',
      newPassword: 'NewPassword16',
    });

    expect(result).toEqual({ success: true, requiresReauth: true });
    expect(employeeUpdate).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { passwordHash: 'new-hash', authVersion: { increment: 1 } },
    });
    expect(authSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ revokeReason: 'password_reset' }),
      }),
    );
    expect(passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { usedAt: expect.any(Date) },
    });
    expect(vaultSession.lock).toHaveBeenCalledWith('e1');
  });
});
