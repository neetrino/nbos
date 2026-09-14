import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmployeeSecurityAdminService } from './employee-security-admin.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

vi.mock('../auth/auth-password-reset', () => ({
  issuePasswordResetForEmployee: vi.fn(),
}));

const { issuePasswordResetForEmployee } = await import('../auth/auth-password-reset');
const issueMock = vi.mocked(issuePasswordResetForEmployee);

describe('EmployeeSecurityAdminService', () => {
  let service: EmployeeSecurityAdminService;
  let prisma: MockPrisma;
  const ownership = {
    assertPlatformOwner: vi.fn(),
    assertFounderNotTarget: vi.fn(),
  };
  const authSessions = { bumpAuthVersionAndRevokeAll: vi.fn() };
  const vaultSession = { lock: vi.fn() };
  const audit = { log: vi.fn() };
  const notifications = { create: vi.fn() };

  beforeEach(() => {
    prisma = createMockPrisma();
    vi.resetAllMocks();
    ownership.assertPlatformOwner.mockResolvedValue(undefined);
    ownership.assertFounderNotTarget.mockResolvedValue(undefined);
    authSessions.bumpAuthVersionAndRevokeAll.mockResolvedValue(3);
    vaultSession.lock.mockResolvedValue(true);
    notifications.create.mockResolvedValue(undefined);
    issueMock.mockResolvedValue({
      email: 'ann@example.com',
      expiresAt: new Date('2026-09-14T12:00:00.000Z'),
    });
    service = new EmployeeSecurityAdminService(
      prisma as never,
      ownership as never,
      authSessions as never,
      vaultSession as never,
      audit as never,
      notifications as never,
    );
  });

  describe('sendPasswordResetLink', () => {
    it('mails the employee and returns no secret', async () => {
      const result = await service.sendPasswordResetLink('owner', 'e1');

      expect(result).toEqual({
        employeeId: 'e1',
        sentToEmail: 'ann@example.com',
        expiresAt: '2026-09-14T12:00:00.000Z',
      });
      expect(issueMock).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'e1', issuedByEmployeeId: 'owner' }),
      );
      expect(JSON.stringify(result)).not.toContain('token');
    });

    it('requires platform owner identity', async () => {
      ownership.assertPlatformOwner.mockRejectedValue(new ForbiddenException());

      await expect(service.sendPasswordResetLink('hr-manager', 'e1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(issueMock).not.toHaveBeenCalled();
    });

    it('refuses the founder-protected target', async () => {
      ownership.assertFounderNotTarget.mockRejectedValue(new ForbiddenException());

      await expect(service.sendPasswordResetLink('owner', 'founder')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(issueMock).not.toHaveBeenCalled();
    });

    it('refuses the caller as target', async () => {
      await expect(service.sendPasswordResetLink('owner', 'owner')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(issueMock).not.toHaveBeenCalled();
    });

    it('audits the action against the acting owner', async () => {
      await service.sendPasswordResetLink('owner', 'e1');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'employee',
          entityId: 'e1',
          action: 'employee.password_reset_link_sent',
          userId: 'owner',
        }),
      );
    });

    it('still succeeds when the in-app notification fails', async () => {
      notifications.create.mockRejectedValue(new Error('notification store down'));

      await expect(service.sendPasswordResetLink('owner', 'e1')).resolves.toMatchObject({
        employeeId: 'e1',
      });
    });
  });

  describe('revokeAllSessions', () => {
    beforeEach(() => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1' });
    });

    it('revokes sessions, bumps authVersion, and locks the vault', async () => {
      const result = await service.revokeAllSessions('owner', 'e1');

      expect(result).toEqual({ employeeId: 'e1', sessionsRevoked: 3 });
      expect(authSessions.bumpAuthVersionAndRevokeAll).toHaveBeenCalledWith('e1', 'admin_revoke');
      expect(vaultSession.lock).toHaveBeenCalledWith('e1');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'employee.sessions_revoked',
          userId: 'owner',
          changes: expect.objectContaining({ sessionsRevoked: 3, vaultLocked: true }),
        }),
      );
    });

    it('audits the real outcome when the vault unlock could not be cleared', async () => {
      vaultSession.lock.mockResolvedValue(false);

      await service.revokeAllSessions('owner', 'e1');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({ vaultLocked: false }),
        }),
      );
    });

    it('requires platform owner identity', async () => {
      ownership.assertPlatformOwner.mockRejectedValue(new ForbiddenException());

      await expect(service.revokeAllSessions('hr-manager', 'e1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(authSessions.bumpAuthVersionAndRevokeAll).not.toHaveBeenCalled();
    });

    it('refuses the caller as target so the owner cannot lock themselves out', async () => {
      await expect(service.revokeAllSessions('owner', 'owner')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(authSessions.bumpAuthVersionAndRevokeAll).not.toHaveBeenCalled();
    });

    it('rejects an unknown employee', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.revokeAllSessions('owner', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(authSessions.bumpAuthVersionAndRevokeAll).not.toHaveBeenCalled();
    });
  });
});
