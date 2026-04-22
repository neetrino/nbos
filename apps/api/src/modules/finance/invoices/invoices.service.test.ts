import { describe, it, expect, beforeEach } from 'vitest';
import { InvoicesService } from './invoices.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new InvoicesService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code INV-YYYY-NNNN', async () => {
      prisma.invoice.create.mockResolvedValue({ id: '1', code: 'INV-2026-0001' });
      const result = await service.create({
        projectId: 'p1',
        amount: 50000,
        type: 'PREPAYMENT',
      });
      expect(result.code).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('inherits tax status from order when orderId is provided', async () => {
      prisma.order.findUnique.mockResolvedValue({ taxStatus: 'TAX_FREE' });
      prisma.invoice.create.mockResolvedValue({
        id: '2',
        code: 'INV-2026-0002',
        taxStatus: 'TAX_FREE',
      });

      await service.create({
        orderId: 'ord-1',
        projectId: 'p1',
        amount: 50000,
        type: 'DEVELOPMENT',
      });

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'ord-1',
            taxStatus: 'TAX_FREE',
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('sets paidDate when marking as PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: '1' });
      prisma.invoice.update.mockResolvedValue({ id: '1', status: 'PAID', paidDate: new Date() });
      await service.updateStatus('1', 'PAID');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PAID',
            paidDate: expect.any(Date),
          }),
        }),
      );
    });

    it('promotes the linked deal when all order invoices are paid and amount is covered', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({ id: 'inv-1', orderId: 'ord-1' });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        status: 'PAID',
        paidDate: new Date(),
      });
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        deal: { id: 'deal-1', status: 'IN_PROGRESS', amount: 100000 },
        invoices: [
          { status: 'PAID', amount: 50000 },
          { status: 'PAID', amount: 50000 },
        ],
      });

      await service.updateStatus('inv-1', 'PAID');

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-1' },
        data: { status: 'WON' },
      });
    });

    it('does not promote the linked deal when at least one order invoice is unpaid', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({ id: 'inv-2', orderId: 'ord-2' });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-2',
        status: 'PAID',
        paidDate: new Date(),
      });
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-2',
        deal: { id: 'deal-2', status: 'IN_PROGRESS', amount: 100000 },
        invoices: [
          { status: 'PAID', amount: 50000 },
          { status: 'THIS_MONTH', amount: 50000 },
        ],
      });

      await service.updateStatus('inv-2', 'PAID');

      expect(prisma.deal.update).not.toHaveBeenCalled();
    });

    it('does not promote the linked deal when paid invoices do not cover deal amount', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({ id: 'inv-3', orderId: 'ord-3' });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-3',
        status: 'PAID',
        paidDate: new Date(),
      });
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-3',
        deal: { id: 'deal-3', status: 'IN_PROGRESS', amount: 120000 },
        invoices: [
          { status: 'PAID', amount: 50000 },
          { status: 'PAID', amount: 50000 },
        ],
      });

      await service.updateStatus('inv-3', 'PAID');

      expect(prisma.deal.update).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats structure', async () => {
      prisma.invoice.count.mockResolvedValue(5);
      prisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _count: 3, _sum: { amount: 40000 } })
        .mockResolvedValueOnce({ _count: 1, _sum: { amount: 10000 } });
      const stats = await service.getStats();
      expect(stats.total).toBe(5);
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats.outstanding).toEqual({ count: 3, amount: 40000 });
      expect(stats.overdue).toEqual({ count: 1, amount: 10000 });
    });
  });
});
