import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { EmployeeAvatarService } from './employee-avatar.service';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const TENANT_ID = '00000000-0000-4000-8000-000000000001';

describe('EmployeeAvatarService', () => {
  let prisma: MockPrisma;
  let artifacts: {
    prepare: ReturnType<typeof vi.fn>;
    executeMachineUpload: ReturnType<typeof vi.fn>;
    fingerprintBytes: ReturnType<typeof vi.fn>;
  };
  let ownership: { assertFounderNotMutatedByOthers: ReturnType<typeof vi.fn> };
  let employees: { findById: ReturnType<typeof vi.fn> };
  let service: EmployeeAvatarService;

  beforeEach(() => {
    prisma = createMockPrisma();
    artifacts = {
      prepare: vi.fn().mockResolvedValue({ id: 'op-1' }),
      executeMachineUpload: vi.fn().mockResolvedValue({
        fileAssetId: 'file-1',
        fileVersionId: 'ver-1',
        fileLinkId: 'link-1',
      }),
      fingerprintBytes: vi.fn().mockReturnValue('fp'),
    };
    ownership = { assertFounderNotMutatedByOthers: vi.fn().mockResolvedValue(undefined) };
    employees = {
      findById: vi
        .fn()
        .mockResolvedValue({ id: 'emp-1', avatar: '/api/employees/emp-1/avatar?v=file-1' }),
    };
    service = new EmployeeAvatarService(
      prisma as never,
      employees as never,
      artifacts as never,
      { bucket: 'nbos', ensureS3: vi.fn() } as never,
      { get: vi.fn().mockReturnValue(TENANT_ID) } as never,
      ownership as never,
    );
  });

  it('uploads own photo through Drive and stores a stable display URL', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', status: 'ACTIVE' });
    const result = await service.uploadOwn('emp-1', {
      originalName: 'me.jpg',
      mimeType: 'image/jpeg',
      bytes: JPEG,
    });
    expect(artifacts.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'EMPLOYEE',
        entityId: 'emp-1',
        sourceModule: 'EMPLOYEES',
        mimeType: 'image/jpeg',
      }),
    );
    expect(artifacts.executeMachineUpload).toHaveBeenCalled();
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      data: { avatar: '/api/employees/emp-1/avatar?v=file-1' },
    });
    expect(result.id).toBe('emp-1');
  });

  it('refuses writes for a terminated employee', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', status: 'TERMINATED' });
    await expect(
      service.uploadOwn('emp-1', { originalName: 'me.jpg', mimeType: 'image/jpeg', bytes: JPEG }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets HR upload after founder protection', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp-2', status: 'ACTIVE' });
    await service.uploadForEmployee('hr-1', 'emp-2', {
      originalName: 'me.jpg',
      mimeType: 'image/jpeg',
      bytes: JPEG,
    });
    expect(ownership.assertFounderNotMutatedByOthers).toHaveBeenCalledWith('hr-1', 'emp-2');
  });

  it('clears the photo pointer on remove', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', status: 'ACTIVE' });
    await service.removeOwn('emp-1');
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      data: { avatar: null },
    });
  });

  it('404s when the employee is missing', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(service.removeOwn('missing')).rejects.toThrow(NotFoundException);
  });
});
