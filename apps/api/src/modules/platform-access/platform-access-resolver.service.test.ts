import { describe, expect, it, vi } from 'vitest';
import { PlatformAccessResolverService } from './platform-access-resolver.service';

describe('PlatformAccessResolverService', () => {
  const prisma = {
    projectTeamMember: { findMany: vi.fn() },
    productTeamMember: { findMany: vi.fn() },
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
});
