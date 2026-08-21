import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

vi.mock('argon2', () => ({
  verify: vi.fn(),
  hash: vi.fn(),
  argon2id: 2,
}));

vi.mock('./auth-session.flags', () => ({
  resolveAuthAccessTokenTtlSeconds: () => 600,
}));

vi.mock('./auth-session.metrics', () => ({
  recordAuthMetric: vi.fn(),
}));

describe('AuthService.changePassword', () => {
  const employeeUpdate = vi.fn();
  const authSessionUpdateMany = vi.fn();
  const prisma = {
    employee: {
      findUnique: vi.fn(),
      update: employeeUpdate,
    },
    authSession: {
      updateMany: authSessionUpdateMany,
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        employee: { update: employeeUpdate },
        authSession: { updateMany: authSessionUpdateMany },
      }),
    ),
  };

  const vaultSession = { lock: vi.fn() };
  const authSessions = {};
  const config = {
    getOrThrow: vi.fn(() => 'test-secret-at-least-32-chars-long!!'),
    get: vi.fn(() => '7d'),
  };

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      prisma as never,
      config as never,
      vaultSession as never,
      authSessions as never,
    );
  });

  it('rejects wrong current password', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      passwordHash: 'hash',
      status: 'ACTIVE',
    });
    vi.mocked(argon2.verify).mockResolvedValueOnce(false);

    await expect(service.changePassword('e1', 'wrong', 'NewPassword1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(employeeUpdate).not.toHaveBeenCalled();
  });

  it('rejects reusing the same password', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      passwordHash: 'hash',
      status: 'ACTIVE',
    });
    vi.mocked(argon2.verify).mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await expect(service.changePassword('e1', 'SamePass1!', 'SamePass1!')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(employeeUpdate).not.toHaveBeenCalled();
  });

  it('updates hash, revokes sessions, locks vault, and denylists jti', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      passwordHash: 'old-hash',
      status: 'ACTIVE',
    });
    vi.mocked(argon2.verify).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(argon2.hash).mockResolvedValue('new-hash');

    const result = await service.changePassword('e1', 'OldPass1!', 'NewPass2!');

    expect(result).toEqual({ success: true, requiresReauth: true });
    expect(employeeUpdate).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: {
        passwordHash: 'new-hash',
        authVersion: { increment: 1 },
      },
    });
    expect(authSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeId: 'e1', status: 'ACTIVE' },
        data: expect.objectContaining({
          status: 'REVOKED',
          revokeReason: 'password_change',
        }),
      }),
    );
    expect(vaultSession.lock).toHaveBeenCalledWith('e1');
  });
});
