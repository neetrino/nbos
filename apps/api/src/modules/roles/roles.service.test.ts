import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';

const SYSTEM_ROLE = {
  id: 'role-seller',
  name: 'Seller',
  slug: 'seller',
  description: null,
  level: 4,
  isSystem: true,
  permissions: [{ scope: 'ALL', permission: { module: 'CLIENTS', action: 'VIEW' } }],
};

describe('RolesService', () => {
  const audit = { log: vi.fn() };
  const prisma = {
    role: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    rolePermission: { deleteMany: vi.fn(), createMany: vi.fn() },
    employee: { updateMany: vi.fn(), count: vi.fn() },
    permissionRoleAssignment: { count: vi.fn() },
    orgSeat: { count: vi.fn() },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  let service: RolesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RolesService(prisma as never, audit as never);
  });

  it('updates the permission matrix on a system role', async () => {
    prisma.role.findUnique.mockResolvedValue(SYSTEM_ROLE);
    prisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
    prisma.rolePermission.createMany.mockResolvedValue({ count: 1 });
    prisma.employee.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.updatePermissions(
      SYSTEM_ROLE.id,
      [{ permissionId: 'perm-clients-add', scope: 'ALL' }],
      'actor-1',
    );

    expect(result.id).toBe(SYSTEM_ROLE.id);
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: SYSTEM_ROLE.id },
    });
    expect(prisma.rolePermission.createMany).toHaveBeenCalled();
    expect(prisma.employee.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { roleId: SYSTEM_ROLE.id },
          { permissionRoleAssignments: { some: { roleId: SYSTEM_ROLE.id } } },
        ],
      },
      data: { accessVersion: { increment: 1 } },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ROLE_PERMISSIONS_UPDATED' }),
    );
  });

  it('still rejects renaming or deleting a system role', async () => {
    prisma.role.findUnique.mockResolvedValue(SYSTEM_ROLE);
    await expect(service.update(SYSTEM_ROLE.id, { name: 'Sales' }, 'actor-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.remove(SYSTEM_ROLE.id, 'actor-1')).rejects.toThrow(BadRequestException);
  });

  it('throws when the role is missing', async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(service.updatePermissions('missing', [], 'actor-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('archival', () => {
    const CUSTOM_ROLE = { ...SYSTEM_ROLE, id: 'role-regional', isSystem: false, archivedAt: null };

    function unused() {
      prisma.employee.count.mockResolvedValue(0);
      prisma.permissionRoleAssignment.count.mockResolvedValue(0);
      prisma.orgSeat.count.mockResolvedValue(0);
    }

    it('archives a role that history keeps referenced', async () => {
      prisma.role.findUnique.mockResolvedValue(CUSTOM_ROLE);
      unused();
      prisma.role.update.mockResolvedValue({ ...CUSTOM_ROLE, archivedAt: new Date() });

      await service.archive(CUSTOM_ROLE.id, 'actor-1');

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: CUSTOM_ROLE.id, archivedAt: null },
        data: { archivedAt: expect.any(Date) },
      });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ROLE_ARCHIVED' }));
    });

    it('refuses to archive while an active grant still exists', async () => {
      prisma.role.findUnique.mockResolvedValue(CUSTOM_ROLE);
      unused();
      prisma.permissionRoleAssignment.count.mockResolvedValue(1);

      await expect(service.archive(CUSTOM_ROLE.id, 'actor-1')).rejects.toThrow(BadRequestException);
      expect(prisma.role.update).not.toHaveBeenCalled();
    });

    it('refuses to archive a role an employee still holds', async () => {
      prisma.role.findUnique.mockResolvedValue(CUSTOM_ROLE);
      unused();
      prisma.employee.count.mockResolvedValue(1);

      await expect(service.archive(CUSTOM_ROLE.id, 'actor-1')).rejects.toThrow(BadRequestException);
    });

    it('refuses to archive a role mapped to an active seat', async () => {
      prisma.role.findUnique.mockResolvedValue(CUSTOM_ROLE);
      unused();
      prisma.orgSeat.count.mockResolvedValue(1);

      await expect(service.archive(CUSTOM_ROLE.id, 'actor-1')).rejects.toThrow(BadRequestException);
    });

    it('refuses to edit permissions of an archived role', async () => {
      prisma.role.findUnique.mockResolvedValue({ ...CUSTOM_ROLE, archivedAt: new Date() });

      await expect(service.updatePermissions(CUSTOM_ROLE.id, [], 'actor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('restores an archived role', async () => {
      prisma.role.findUnique.mockResolvedValue({ ...CUSTOM_ROLE, archivedAt: new Date() });
      prisma.role.update.mockResolvedValue(CUSTOM_ROLE);

      await service.restore(CUSTOM_ROLE.id, 'actor-1');

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: CUSTOM_ROLE.id },
        data: { archivedAt: null },
      });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ROLE_RESTORED' }));
    });
  });
});
