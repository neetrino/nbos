import { describe, expect, it, vi } from 'vitest';
import { DriveAccessContextService } from './drive-access-context.service';

describe('DriveAccessContextService', () => {
  it('merges RBAC scope with DRIVE family policy', async () => {
    const platformAccess = {
      resolveScopeModeForFamily: vi.fn().mockResolvedValue('ASSIGNED'),
    };
    const service = new DriveAccessContextService(platformAccess as never);

    const access = await service.fromRequest(
      { id: 'emp-1', departmentIds: ['dep-1'], role: 'pm', permissions: {} },
      'ALL',
    );

    expect(platformAccess.resolveScopeModeForFamily).toHaveBeenCalledWith('emp-1', 'DRIVE');
    expect(access).toEqual({
      employeeId: 'emp-1',
      departmentIds: ['dep-1'],
      driveScope: 'OWN',
    });
  });

  it('keeps ALL drive scope for CEO or Founder when RBAC ceiling is ALL', async () => {
    const platformAccess = {
      resolveScopeModeForFamily: vi.fn().mockResolvedValue('ASSIGNED'),
    };
    const service = new DriveAccessContextService(platformAccess as never);

    const ceo = await service.fromRequest(
      { id: 'emp-1', departmentIds: [], role: 'ceo', permissions: {} },
      'ALL',
    );
    expect(ceo.driveScope).toBe('ALL');

    const founder = await service.fromRequest(
      {
        id: 'emp-2',
        departmentIds: [],
        role: 'pm',
        isPlatformOwner: true,
        permissions: {},
      },
      'ALL',
    );
    expect(founder.driveScope).toBe('ALL');

    const legacyOwnerSlug = await service.fromRequest(
      { id: 'emp-3', departmentIds: [], role: 'owner', permissions: {} },
      'ALL',
    );
    expect(legacyOwnerSlug.driveScope).toBe('OWN');
  });
});
