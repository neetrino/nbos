import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentsService } from './payments.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PaymentsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies invoiceId filter', async () => {
      await service.findAll({ invoiceId: 'inv1' });
      expect(prisma.payment.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates payment and syncs invoice', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({ id: 'inv1', orderId: 'ord1' })
        .mockResolvedValueOnce({ amount: 100000, payments: [{ amount: 50000 }] });
      prisma.payment.create.mockResolvedValue({ id: '1', amount: 50000 });
      prisma.invoice.findMany.mockResolvedValue([{ status: 'NEW' }]);

      const result = await service.create({
        invoiceId: 'inv1',
        amount: 50000,
        paymentDate: '2026-03-11',
      });
      expect(result.amount).toBe(50000);
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { status: 'THIS_MONTH', paidDate: null },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord1' },
        data: { status: 'ACTIVE' },
      });
    });

    it('marks invoice and order as paid when coverage reaches total amount', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({ id: 'inv1', orderId: 'ord1' })
        .mockResolvedValueOnce({
          amount: 100000,
          payments: [{ amount: 60000 }, { amount: 40000 }],
        });
      prisma.payment.create.mockResolvedValue({ id: '2', amount: 40000 });
      prisma.invoice.findMany.mockResolvedValue([{ status: 'PAID' }, { status: 'PAID' }]);

      await service.create({
        invoiceId: 'inv1',
        amount: 40000,
        paymentDate: '2026-03-12',
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { status: 'PAID', paidDate: expect.any(Date) },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord1' },
        data: { status: 'FULLY_PAID' },
      });
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: '1',
        invoiceId: 'inv1',
        invoice: { orderId: 'ord1' },
      });
      prisma.invoice.findUnique.mockResolvedValue({
        amount: 100000,
        payments: [],
      });
      prisma.invoice.findMany.mockResolvedValue([{ status: 'NEW' }]);
      await service.delete('1');
      expect(prisma.payment.delete).toHaveBeenCalled();
    });
  });
});
