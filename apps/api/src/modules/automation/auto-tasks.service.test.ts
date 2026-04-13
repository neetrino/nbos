import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTasksService } from './auto-tasks.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('AutoTasksService', () => {
  let service: AutoTasksService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AutoTasksService(prisma as never);
  });

  describe('generateTasksForDeal', () => {
    it('should generate 8 tasks for WEB_APP type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-1', 'WEB_APP', 'user-1');

      expect(result.created).toBe(8);
      expect(prisma.task.create).toHaveBeenCalledTimes(8);
    });

    it('should generate 8 tasks for COMPANY_WEBSITE type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-w', 'COMPANY_WEBSITE', 'user-1');
      expect(result.created).toBe(8);
    });

    it('should generate 5 tasks for LOGO type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-2', 'LOGO', 'user-1');
      expect(result.created).toBe(5);
    });

    it('should generate 8 tasks for MOBILE_APP type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-3', 'MOBILE_APP', 'user-1');
      expect(result.created).toBe(8);
    });

    it('should generate 9 tasks for ECOMMERCE type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-ec', 'ECOMMERCE', 'user-1');
      expect(result.created).toBe(9);
    });

    it('should generate 6 tasks for SEO type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-seo', 'SEO', 'user-1');
      expect(result.created).toBe(6);
    });

    it('should fallback to OTHER template for unknown type', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });

      const result = await service.generateTasksForDeal('deal-5', 'UNKNOWN', 'user-1');
      expect(result.created).toBe(4);
    });

    it('should generate sequential codes', async () => {
      prisma.task.findFirst.mockResolvedValue({ code: 'T-2026-0010' });
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0011' });

      await service.generateTasksForDeal('deal-1', 'COMPANY_WEBSITE', 'user-1');

      const firstCall = prisma.task.create.mock.calls[0]![0] as { data: { code: string } };
      expect(firstCall.data.code).toBe('T-2026-0011');
    });
  });
});
