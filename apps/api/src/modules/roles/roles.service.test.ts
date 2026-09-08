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
});
