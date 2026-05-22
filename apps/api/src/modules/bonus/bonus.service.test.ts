import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { BonusService } from './bonus.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';
import type { NotificationService } from '../notifications/notification.service';

describe('BonusService', () => {
  let service: BonusService;
  let prisma: MockPrisma;
  let notifications: NotificationService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new BonusService(prisma as never, notifications);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({ employeeId: 'e1', status: 'ACTIVE', type: 'SALES' });
      expect(prisma.bonusEntry.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates bonus entry', async () => {
      prisma.bonusEntry.create.mockResolvedValue({ id: '1', type: 'SALES', amount: 25000 });
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        projectId: 'p1',
        productId: null,
        extensionId: null,
      });
      prisma.bonusEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(25000) } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
      prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.productBonusPool.upsert.mockResolvedValue({});
      const result = await service.create({
        employeeId: 'e1',
        orderId: 'o1',
        projectId: 'p1',
        type: 'SALES',
        amount: 25000,
        percent: 10,
      });
      expect(result.type).toBe('SALES');
      expect(prisma.productBonusPool.upsert).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.bonusEntry.findUnique.mockResolvedValue({ id: '1', orderId: 'o1' });
      prisma.bonusEntry.update.mockResolvedValue({ id: '1', status: 'PAID' });
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        projectId: 'p1',
        productId: null,
        extensionId: null,
      });
      prisma.bonusEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } });
      prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.productBonusPool.upsert.mockResolvedValue({});
      const result = await service.updateStatus('1', 'PAID');
      expect(result.status).toBe('PAID');
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
    });
  });

  describe('getProductPools', () => {
    it('returns empty when no bonus rows', async () => {
      prisma.bonusEntry.groupBy.mockResolvedValue([]);
      const rows = await service.getProductPools();
      expect(rows).toEqual([]);
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it('folds order groupBy rows with product pool metadata', async () => {
      prisma.bonusEntry.groupBy.mockResolvedValue([
        { orderId: 'o1', status: 'ACTIVE', _sum: { amount: new Decimal('100') }, _count: 2 },
        { orderId: 'o1', status: 'PAID', _sum: { amount: new Decimal('50') }, _count: 1 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'o1',
          code: 'ORD-1',
          projectId: 'p1',
          productId: 'prod1',
          extensionId: null,
          project: { id: 'p1', code: 'PR-1', name: 'Alpha' },
          product: { id: 'prod1', name: 'Site' },
          extension: null,
        },
      ]);
      prisma.productBonusPool.findMany.mockResolvedValue([
        {
          orderId: 'o1',
          totalPlannedAmount: new Decimal('150'),
          totalReleasedAmount: new Decimal('0'),
          totalRemainingAmount: new Decimal('150'),
          availableFunding: new Decimal('0'),
          overFundingAmount: new Decimal('0'),
          status: 'ACTIVE',
        },
      ]);
      prisma.bonusEntry.findMany.mockResolvedValue([
        { orderId: 'o1', employeeId: 'e1' },
        { orderId: 'o1', employeeId: 'e2' },
      ]);
      const rows = await service.getProductPools();
      expect(rows).toHaveLength(1);
      expect(rows[0].poolKey).toBe('product:prod1');
      expect(rows[0].sumPaidAmount).toBe('50.00');
      expect(rows[0].sumPipelineAmount).toBe('100.00');
      expect(rows[0].ledgerPlannedAmount).toBe('150.00');
      expect(rows[0].employeeCount).toBe(2);
      expect(rows[0].fundingHealth).toBe('EMPTY');
    });
  });
});
