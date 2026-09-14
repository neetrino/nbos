import { describe, expect, it, vi } from 'vitest';
import { PlatformAccessResolverService } from './platform-access-resolver.service';

describe('PlatformAccessResolverService', () => {
  const prisma = {
    projectTeamMember: { findMany: vi.fn() },
    productTeamMember: { findMany: vi.fn() },
    employee: { findUnique: vi.fn() },
    employeeAccessOverride: { findUnique: vi.fn() },
    roleAccessPolicy: { findMany: vi.fn() },
  };

  const service = new PlatformAccessResolverService(prisma as never);

  it('loadTeamContext aggregates project and product ids', async () => {
    prisma.projectTeamMember.findMany.mockResolvedValue([
      { projectId: 'p1', role: 'ADMIN' },
      { projectId: 'p2', role: 'MEMBER' },
    ]);
    prisma.productTeamMember.findMany.mockResolvedValue([
      { productId: 'prod-a' },
      { productId: 'prod-b' },
    ]);

    const ctx = await service.loadTeamContext('emp-1');
    expect(ctx.projectIds).toEqual(['p1', 'p2']);
    expect(ctx.productIds).toEqual(['prod-a', 'prod-b']);
    expect(ctx.projectAdminProjectIds).toEqual(['p1']);
  });

  it('employeeInProductTeam isolates product scope', () => {
    const ctx = { projectIds: ['p1'], productIds: ['prod-a'], projectAdminProjectIds: [] };
    expect(service.employeeInProductTeam(ctx, 'prod-a')).toBe(true);
    expect(service.employeeInProductTeam(ctx, 'prod-b')).toBe(false);
  });

  it('resolveScopeModeForFamily returns role policy scope', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      roleId: 'role-1',
      permissionRoleAssignments: [{ roleId: 'role-2' }],
    });
    prisma.employeeAccessOverride.findUnique.mockResolvedValue(null);
    prisma.roleAccessPolicy.findMany.mockResolvedValue([
      { scopeMode: 'ASSIGNED' },
      { scopeMode: 'ALL' },
    ]);

    const mode = await service.resolveScopeModeForFamily('emp-1', 'CREDENTIALS');
    expect(mode).toBe('ALL');
  });

  it('keeps the implicit ASSIGNED default when another role explicitly denies access', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      roleId: 'role-with-default',
      permissionRoleAssignments: [{ roleId: 'role-with-policy' }],
    });
    prisma.employeeAccessOverride.findUnique.mockResolvedValue(null);
    prisma.roleAccessPolicy.findMany.mockResolvedValue([{ scopeMode: 'NONE' }]);

    const mode = await service.resolveScopeModeForFamily('emp-1', 'DRIVE');

    expect(mode).toBe('ASSIGNED');
  });
});
