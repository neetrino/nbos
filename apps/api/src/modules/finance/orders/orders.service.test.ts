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
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          code: 'ORD-2026-0001',
          totalAmount: 100000,
          project: {
            id: 'p1',
            code: 'P-1',
            name: 'Project',
            company: { id: 'c1', name: 'Company' },
            contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
          },
          invoices: [{ payments: [{ amount: 25000 }, { amount: 15000 }] }],
          _count: { invoices: 1 },
        },
      ]);

      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
      expect(result.items[0]).toMatchObject({
        amount: 100000,
        paidAmount: 40000,
        company: { id: 'c1', name: 'Company' },
        contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
      });
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

    it('returns derived paid amount and project-linked company/contact', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        code: 'ORD-2026-0001',
        totalAmount: 120000,
        project: {
          id: 'p1',
          name: 'Project',
          company: { id: 'c1', name: 'Company' },
          contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
        },
        invoices: [
          { payments: [{ amount: 20000 }, { amount: 10000 }] },
          { payments: [{ amount: 15000 }] },
        ],
      });

      const result = await service.findById('ord-1');

      expect(result).toMatchObject({
        amount: 120000,
        paidAmount: 45000,
        company: { id: 'c1', name: 'Company' },
        contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
      });
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
      prisma.order.findUnique.mockResolvedValue({
        id: '1',
        project: { company: null, contact: null },
        invoices: [],
      });
      prisma.order.update.mockResolvedValue({ id: '1', status: 'COMPLETED' });
      const result = await service.updateStatus('1', 'COMPLETED');
      expect(result.status).toBe('COMPLETED');
    });
  });
});
