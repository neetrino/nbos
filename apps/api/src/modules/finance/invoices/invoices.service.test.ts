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
  });

  describe('getStats', () => {
    it('returns stats structure', async () => {
      prisma.invoice.count.mockResolvedValue(5);
      const stats = await service.getStats();
      expect(stats.total).toBe(5);
      expect(stats).toHaveProperty('totalRevenue');
    });
  });
});
