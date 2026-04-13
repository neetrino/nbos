import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchedulerService } from './scheduler.service';
import { BillingService } from '../finance/billing/billing.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

function createMockBillingService(): Partial<BillingService> {
  return {
    runMonthlyBilling: vi.fn().mockResolvedValue({
      generatedInvoices: 3,
      totalAmount: 15000,
      errors: [],
    }),
    runMonthlyExpenses: vi.fn().mockResolvedValue({ generated: 2 }),
  };
}

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: MockPrisma;
  let billingService: ReturnType<typeof createMockBillingService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    billingService = createMockBillingService();
    service = new SchedulerService(prisma as never, billingService as never);
  });

  describe('runBilling', () => {
    it('should delegate to BillingService', async () => {
      const result = await service.runBilling();

      expect(billingService.runMonthlyBilling).toHaveBeenCalled();
      expect(result.generatedInvoices).toBe(3);
      expect(result.totalAmount).toBe(15000);
    });
  });

  describe('runExpenses', () => {
    it('should delegate to BillingService', async () => {
      const result = await service.runExpenses();

      expect(billingService.runMonthlyExpenses).toHaveBeenCalled();
      expect(result.generated).toBe(2);
    });
  });

  describe('markOverdueInvoices', () => {
    it('should mark overdue invoices', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { id: 'inv-1', code: 'INV-2026-0001' },
        { id: 'inv-2', code: 'INV-2026-0002' },
      ]);

      const result = await service.markOverdueInvoices();

      expect(result.marked).toBe(2);
      expect(result.invoiceIds).toEqual(['inv-1', 'inv-2']);
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['inv-1', 'inv-2'] } },
          data: { status: 'DELAYED' },
        }),
      );
    });

    it('should return 0 when no overdue invoices', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);

      const result = await service.markOverdueInvoices();

      expect(result.marked).toBe(0);
      expect(result.invoiceIds).toEqual([]);
      expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    });
  });
});
