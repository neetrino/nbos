import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTasksService } from './auto-tasks.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('AutoTasksService', () => {
  let service: AutoTasksService;
  let prisma: MockPrisma;
  const year = new Date().getFullYear();

  beforeEach(() => {
    prisma = createMockPrisma();
    // Stands in for the entity_code_counters upsert, which hands out one number per call.
    let reserved = 0;
    prisma.$queryRaw.mockImplementation(() => Promise.resolve([{ next_value: ++reserved }]));
    prisma.task.create.mockResolvedValue({ id: '1', code: `T-${year}-0001` });
    service = new AutoTasksService(prisma as never);
  });

  describe('generateTasksForDeal', () => {
    it('should generate 8 tasks for WEB_APP type', async () => {
      const result = await service.generateTasksForDeal('deal-1', 'WEB_APP', 'user-1');

      expect(result.created).toBe(8);
      expect(prisma.task.create).toHaveBeenCalledTimes(8);
    });

    it('should generate 8 tasks for COMPANY_WEBSITE type', async () => {
      const result = await service.generateTasksForDeal('deal-w', 'COMPANY_WEBSITE', 'user-1');
      expect(result.created).toBe(8);
    });

    it('should generate 5 tasks for LOGO type', async () => {
      const result = await service.generateTasksForDeal('deal-2', 'LOGO', 'user-1');
      expect(result.created).toBe(5);
    });

    it('should generate 8 tasks for MOBILE_APP type', async () => {
      const result = await service.generateTasksForDeal('deal-3', 'MOBILE_APP', 'user-1');
      expect(result.created).toBe(8);
    });

    it('should generate 9 tasks for ECOMMERCE type', async () => {
      const result = await service.generateTasksForDeal('deal-ec', 'ECOMMERCE', 'user-1');
      expect(result.created).toBe(9);
    });

    it('should generate 6 tasks for SEO type', async () => {
      const result = await service.generateTasksForDeal('deal-seo', 'SEO', 'user-1');
      expect(result.created).toBe(6);
    });

    it('should fallback to OTHER template for unknown type', async () => {
      const result = await service.generateTasksForDeal('deal-5', 'UNKNOWN', 'user-1');
      expect(result.created).toBe(4);
    });

    /**
     * Automation shares the Task code series with TasksService and Support, so it has to
     * reserve every number from the counter. Deriving one from max(tasks) here would leave
     * the counter behind the table and make the next ordinary create collide.
     */
    it('reserves each code from the counter instead of reading existing tasks', async () => {
      await service.generateTasksForDeal('deal-1', 'COMPANY_WEBSITE', 'user-1');

      const codes = prisma.task.create.mock.calls.map(
        (call) => (call[0] as { data: { code: string } }).data.code,
      );
      expect(codes).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((n) => `T-${year}-000${n}`));
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(8);
      expect(prisma.task.findFirst).not.toHaveBeenCalled();
    });
  });
});
