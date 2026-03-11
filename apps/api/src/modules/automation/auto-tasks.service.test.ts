import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AutoTasksService } from './auto-tasks.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('AutoTasksService', () => {
  let service: AutoTasksService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AutoTasksService(prisma as never);
  });

  describe('generateTasksForProduct', () => {
    it('should generate 8 tasks for WEB_APP product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        projectId: 'proj-1',
        productType: 'WEB_APP',
        name: 'Test Web App',
      });
      prisma.task.findFirst.mockResolvedValue(null);

      const result = await service.generateTasksForProduct('prod-1', 'user-1');

      expect(result.created).toBe(8);
      expect(prisma.task.create).toHaveBeenCalledTimes(8);
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            productId: 'prod-1',
            creatorId: 'user-1',
          }),
        }),
      );
    });

    it('should generate 5 tasks for DESIGN product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-2',
        projectId: 'proj-1',
        productType: 'DESIGN',
        name: 'Logo Design',
      });
      prisma.task.findFirst.mockResolvedValue(null);

      const result = await service.generateTasksForProduct('prod-2', 'user-1');

      expect(result.created).toBe(5);
    });

    it('should generate 8 tasks for MOBILE_APP product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-3',
        projectId: 'proj-1',
        productType: 'MOBILE_APP',
        name: 'Mobile App',
      });
      prisma.task.findFirst.mockResolvedValue(null);

      const result = await service.generateTasksForProduct('prod-3', 'user-1');
      expect(result.created).toBe(8);
    });

    it('should generate 5 tasks for INTEGRATION product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-4',
        projectId: 'proj-1',
        productType: 'INTEGRATION',
        name: 'API Integration',
      });
      prisma.task.findFirst.mockResolvedValue(null);

      const result = await service.generateTasksForProduct('prod-4', 'user-1');
      expect(result.created).toBe(5);
    });

    it('should fallback to OTHER template for unknown type', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-5',
        projectId: 'proj-1',
        productType: 'UNKNOWN',
        name: 'Unknown',
      });
      prisma.task.findFirst.mockResolvedValue(null);

      const result = await service.generateTasksForProduct('prod-5', 'user-1');
      expect(result.created).toBe(4);
    });

    it('should throw NotFoundException for missing product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.generateTasksForProduct('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate sequential codes', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        projectId: 'proj-1',
        productType: 'INTEGRATION',
        name: 'Test',
      });
      prisma.task.findFirst.mockResolvedValue({ code: 'T-2026-0010' });

      await service.generateTasksForProduct('prod-1', 'user-1');

      const firstCall = prisma.task.create.mock.calls[0]![0] as { data: { code: string } };
      expect(firstCall.data.code).toBe('T-2026-0011');
    });
  });
});
