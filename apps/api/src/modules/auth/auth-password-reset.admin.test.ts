import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { issuePasswordResetForEmployee } from './auth-password-reset';
import { sendPasswordResetEmail } from './auth-password-reset.email';

vi.mock('./auth-password-reset.email', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

const sendEmailMock = vi.mocked(sendPasswordResetEmail);

describe('issuePasswordResetForEmployee (owner-initiated)', () => {
  const passwordResetToken = { create: vi.fn(), deleteMany: vi.fn() };
  const employeeFindUnique = vi.fn();
  const prisma = {
    employee: { findUnique: employeeFindUnique },
    passwordResetToken,
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };
  const logger = { log: vi.fn(), warn: vi.fn() } as unknown as Logger;

  const activeEmployee = {
    id: 'e1',
    email: 'ann@example.com',
    passwordHash: 'hash',
    status: 'ACTIVE',
    interfaceLocale: 'ru',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue({ delivered: true });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
  });

  it('mails the link and returns no token to the caller', async () => {
    employeeFindUnique.mockResolvedValue(activeEmployee);

    const result = await issuePasswordResetForEmployee({
      prisma: prisma as never,
      logger,
      employeeId: 'e1',
      issuedByEmployeeId: 'owner',
    });

    expect(result).toEqual({ email: 'ann@example.com', expiresAt: expect.any(Date) });
    expect(Object.keys(result)).not.toContain('token');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ann@example.com', locale: 'ru' }),
    );
  });

  it('stores only the token hash and drops pending tokens', async () => {
    employeeFindUnique.mockResolvedValue(activeEmployee);

    await issuePasswordResetForEmployee({
      prisma: prisma as never,
      logger,
      employeeId: 'e1',
      issuedByEmployeeId: 'owner',
    });

    expect(passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { employeeId: 'e1', usedAt: null },
    });
    const created = passwordResetToken.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(created).toHaveProperty('tokenHash');
    expect(created).not.toHaveProperty('token');
  });

  it('records the acting owner in the audit log line', async () => {
    employeeFindUnique.mockResolvedValue(activeEmployee);

    await issuePasswordResetForEmployee({
      prisma: prisma as never,
      logger,
      employeeId: 'e1',
      issuedByEmployeeId: 'owner',
    });

    const logged = JSON.stringify((logger.log as unknown as ReturnType<typeof vi.fn>).mock.calls);
    expect(logged).toContain('auth.password_reset_issued');
    expect(logged).toContain('issuedByEmployeeId');
  });

  it('rejects an unknown employee', async () => {
    employeeFindUnique.mockResolvedValue(null);

    await expect(
      issuePasswordResetForEmployee({
        prisma: prisma as never,
        logger,
        employeeId: 'missing',
        issuedByEmployeeId: 'owner',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('rejects a terminated employee', async () => {
    employeeFindUnique.mockResolvedValue({ ...activeEmployee, status: 'TERMINATED' });

    await expect(
      issuePasswordResetForEmployee({
        prisma: prisma as never,
        logger,
        employeeId: 'e1',
        issuedByEmployeeId: 'owner',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('fails loudly when the provider did not accept the email', async () => {
    employeeFindUnique.mockResolvedValue(activeEmployee);
    sendEmailMock.mockResolvedValue({ delivered: false, reason: 'provider_unset' });

    await expect(
      issuePasswordResetForEmployee({
        prisma: prisma as never,
        logger,
        employeeId: 'e1',
        issuedByEmployeeId: 'owner',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects an employee that has no password yet', async () => {
    employeeFindUnique.mockResolvedValue({ ...activeEmployee, passwordHash: null });

    await expect(
      issuePasswordResetForEmployee({
        prisma: prisma as never,
        logger,
        employeeId: 'e1',
        issuedByEmployeeId: 'owner',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
