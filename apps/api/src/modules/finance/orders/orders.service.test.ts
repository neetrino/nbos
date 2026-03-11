import { describe, it, expect, beforeEach } from 'vitest';
import { OrdersService } from './orders.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'ACTIVE' });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code ORD-YYYY-NNNN', async () => {
      prisma.order.create.mockResolvedValue({ id: '1', code: 'ORD-2026-0001' });
      const result = await service.create({
        projectId: 'p1',
        type: 'PRODUCT',
        paymentType: 'FULL',
        totalAmount: 100000,
      });
      expect(result.code).toMatch(/^ORD-\d{4}-\d{4}$/);
    });
  });

  describe('updateStatus', () => {
    it('updates status when found', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: '1' });
      prisma.order.update.mockResolvedValue({ id: '1', status: 'COMPLETED' });
      const result = await service.updateStatus('1', 'COMPLETED');
      expect(result.status).toBe('COMPLETED');
    });
  });
});
