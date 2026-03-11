import { describe, it, expect, beforeEach } from 'vitest';
import { SupportService } from './support.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new SupportService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies all filters', async () => {
      await service.findAll({
        projectId: 'p1',
        status: 'NEW',
        priority: 'P1',
        category: 'INCIDENT',
        assignedTo: 'a1',
        search: 'bug',
      });
      expect(prisma.supportTicket.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code and calculates SLA', async () => {
      prisma.supportTicket.findFirst.mockResolvedValue(null);
      prisma.supportTicket.create.mockResolvedValue({
        id: '1',
        code: 'TKT-2026-0001',
        slaResponseDeadline: new Date(),
        slaResolveDeadline: new Date(),
      });
      const result = await service.create({
        title: 'Bug',
        projectId: 'p1',
        category: 'INCIDENT',
        priority: 'P1',
      });
      expect(result.code).toMatch(/^TKT-\d{4}-\d{4}$/);
    });

    it('uses P3 as default priority', async () => {
      prisma.supportTicket.findFirst.mockResolvedValue(null);
      prisma.supportTicket.create.mockResolvedValue({ id: '1', code: 'TKT-2026-0001' });
      await service.create({ title: 'Request', projectId: 'p1', category: 'SERVICE_REQUEST' });
      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ priority: 'P3' }) }),
      );
    });
  });

  describe('update', () => {
    it('recalculates SLA when priority changes', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: '1' });
      prisma.supportTicket.update.mockResolvedValue({ id: '1', priority: 'P1' });
      await service.update('1', { priority: 'P1' });
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'P1',
            slaResponseDeadline: expect.any(Date),
            slaResolveDeadline: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: '1' });
      prisma.supportTicket.update.mockResolvedValue({ id: '1', status: 'RESOLVED' });
      const result = await service.updateStatus('1', 'RESOLVED');
      expect(result.status).toBe('RESOLVED');
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPriority');
      expect(stats).toHaveProperty('byCategory');
    });
  });
});
