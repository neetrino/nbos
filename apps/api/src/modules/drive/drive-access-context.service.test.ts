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

  it('keeps ALL drive scope for owner when RBAC ceiling is ALL', async () => {
    const platformAccess = {
      resolveScopeModeForFamily: vi.fn().mockResolvedValue('ASSIGNED'),
    };
    const service = new DriveAccessContextService(platformAccess as never);

    const access = await service.fromRequest(
      { id: 'emp-1', departmentIds: [], role: 'owner', permissions: {} },
      'ALL',
    );

    expect(access.driveScope).toBe('ALL');
  });
});
