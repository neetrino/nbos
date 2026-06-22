import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeeOffboardingService } from './employee-offboarding.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('EmployeeOffboardingService', () => {
  let service: EmployeeOffboardingService;
  let prisma: MockPrisma;
  const audit = { log: vi.fn() };
  const notifications = { create: vi.fn().mockResolvedValue({ id: 'n1' }) };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new EmployeeOffboardingService(
      prisma as never,
      audit as never,
      notifications as never,
    );
    vi.clearAllMocks();
  });

  describe('buildPreview', () => {
    it('throws when employee is missing', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(service.buildPreview('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns inventory summary', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'e1',
        firstName: 'Ann',
        lastName: 'Lee',
        status: 'ACTIVE',
      });
      prisma.task.count.mockResolvedValue(2);
      prisma.projectTeamMember.findMany.mockResolvedValue([{ projectId: 'p1' }]);
      prisma.productTeamMember.findMany.mockResolvedValue([]);
      prisma.resourceAccessGrant.count.mockResolvedValue(1);
      prisma.resourceAccessGrant.findMany.mockResolvedValue([{ resourceId: 'c1' }]);
      prisma.credential.findMany.mockResolvedValue([{ id: 'c2' }]);
      prisma.fileAssetGrant.count.mockResolvedValue(0);

      const preview = await service.buildPreview('e1');
      expect(preview.employeeName).toBe('Ann Lee');
      expect(preview.inventory.activeTaskCount).toBe(2);
      expect(preview.inventory.projectTeamCount).toBe(1);
      expect(preview.inventory.credentialIds).toEqual(['c1', 'c2']);
    });
  });

  describe('execute', () => {
    it('rejects already terminated employees', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'e1',
        firstName: 'Ann',
        lastName: 'Lee',
        status: 'TERMINATED',
      });
      await expect(service.execute('e1', 'actor')).rejects.toThrow(BadRequestException);
    });
  });
});
