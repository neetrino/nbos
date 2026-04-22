import { describe, it, expect, beforeEach } from 'vitest';
import { TasksService } from './tasks.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new TasksService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({
        status: 'NEW',
        priority: 'HIGH',
        assigneeId: 'a1',
        search: 'test',
      });
      expect(prisma.task.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEntity', () => {
    it('returns tasks linked to a product entity', async () => {
      prisma.task.findMany.mockResolvedValue([{ id: 't1', title: 'Build landing page' }]);

      const result = await service.findByEntity('PRODUCT', 'prod-1');

      expect(result).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { links: { some: { entityType: 'PRODUCT', entityId: 'prod-1' } } },
        }),
      );
    });

    it('returns tasks linked to an extension entity', async () => {
      prisma.task.findMany.mockResolvedValue([{ id: 't2', title: 'Fix extension QA issue' }]);

      const result = await service.findByEntity('EXTENSION', 'ext-1');

      expect(result).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { links: { some: { entityType: 'EXTENSION', entityId: 'ext-1' } } },
        }),
      );
    });
  });

  describe('create', () => {
    it('generates code T-YYYY-NNNN', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });
      const result = await service.create({ title: 'Test', creatorId: 'c1' });
      expect(result.code).toMatch(/^T-\d{4}-\d{4}$/);
    });
  });

  describe('update', () => {
    it('updates task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: '1' });
      prisma.task.update.mockResolvedValue({ id: '1', title: 'Updated' });
      const result = await service.update('1', {
        title: 'Updated',
        priority: 'HIGH',
        dueDate: '2026-12-31',
      });
      expect(result.title).toBe('Updated');
    });
  });

  describe('start', () => {
    it('starts a task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: '1', status: 'NEW' });
      prisma.task.update.mockResolvedValue({ id: '1', status: 'IN_PROGRESS' });
      const result = await service.start('1');
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('complete', () => {
    it('completes a task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: '1', status: 'IN_PROGRESS' });
      prisma.task.update.mockResolvedValue({ id: '1', status: 'DONE' });
      const result = await service.complete('1');
      expect(result.status).toBe('DONE');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.task.delete).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats structure', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPriority');
    });
  });
});
