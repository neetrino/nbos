import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('PartnersService', () => {
  let service: PartnersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PartnersService(prisma as never);
  });

  describe('findAll', () => {
    it('should list partners with pagination', async () => {
      prisma.partner.findMany.mockResolvedValue([
        { id: '1', name: 'Partner A', _count: { subscriptions: 3, orders: 5 } },
      ]);
      prisma.partner.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ search: 'acme' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'acme', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ status: 'ACTIVE' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should filter by direction', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ direction: 'OUTBOUND' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ direction: 'OUTBOUND' }),
        }),
      );
    });

    it('should include contact summary for list rows', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            contact: { select: { id: true, firstName: true, lastName: true } },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return partner', async () => {
      prisma.partner.findUnique.mockResolvedValue({ id: '1', name: 'P1' });

      const result = await service.findById('1');
      expect(result.name).toBe('P1');
    });

    it('should throw NotFoundException', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create partner with defaults', async () => {
      await service.create({ name: 'New Partner' });

      expect(prisma.partner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Partner',
            type: 'REGULAR',
            direction: 'INBOUND',
            defaultPercent: 30,
            status: 'ACTIVE',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update partner fields', async () => {
      prisma.partner.findUnique.mockResolvedValue({ id: '1' });

      await service.update('1', { name: 'Updated', defaultPercent: 25 });

      expect(prisma.partner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Updated',
            defaultPercent: 25,
          }),
        }),
      );
    });

    it('should throw NotFoundException for missing partner', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete partner', async () => {
      prisma.partner.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.partner.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      prisma.partner.count.mockResolvedValue(10);
      prisma.subscription.count.mockResolvedValue(25);
      prisma.partner.aggregate.mockResolvedValue({
        _avg: { defaultPercent: 28.5 },
      });

      const stats = await service.getStats();

      expect(stats.total).toBe(10);
      expect(stats.totalSubscriptions).toBe(25);
      expect(stats.avgPayoutPercent).toBe(28.5);
    });
  });
});
