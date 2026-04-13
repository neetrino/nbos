import { describe, it, expect, beforeEach } from 'vitest';
import { BillingService } from './billing.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new BillingService(prisma as never);
  });

  describe('runMonthlyBilling', () => {
    it('should generate invoices for active subscriptions on billing day', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          code: 'SUB-2026-0001',
          projectId: 'proj-1',
          amount: 5000,
          billingDay: 15,
          status: 'ACTIVE',
          project: { id: 'proj-1', code: 'P-2026-0001', name: 'Test' },
        },
      ]);
      prisma.invoice.findFirst.mockResolvedValueOnce(null);
      prisma.invoice.create.mockResolvedValue({ id: 'inv-1', code: 'INV-2026-0001' });

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.totalAmount).toBe(5000);
      expect(result.errors.length).toBe(0);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionId: 'sub-1',
            projectId: 'proj-1',
            amount: 5000,
            type: 'SUBSCRIPTION',
          }),
        }),
      );
    });

    it('should skip if invoice already exists for this month', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          code: 'SUB-2026-0001',
          projectId: 'proj-1',
          amount: 5000,
          billingDay: 15,
        },
      ]);
      prisma.invoice.findFirst.mockResolvedValueOnce({ id: 'existing-inv' });

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('should return empty when no subscriptions match billing day', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.runMonthlyBilling(new Date(2026, 2, 5));

      expect(result.generatedInvoices).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should collect errors without stopping', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-1', code: 'SUB-1', projectId: 'p1', amount: 100, billingDay: 15 },
        { id: 'sub-2', code: 'SUB-2', projectId: 'p2', amount: 200, billingDay: 15 },
      ]);
      prisma.invoice.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      prisma.invoice.create
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id: 'inv-2', code: 'INV-2' });

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('SUB-1');
    });
  });

  describe('runMonthlyExpenses', () => {
    it('should generate planned expenses on the 1st', async () => {
      const firstOfMonth = new Date(2026, 3, 1);
      prisma.expense.count.mockResolvedValue(0);
      prisma.expense.findMany.mockResolvedValue([
        {
          projectId: 'p1',
          category: 'OFFICE',
          type: 'PLANNED',
          name: 'Office rent',
          amount: 1000,
          notes: null,
        },
        {
          projectId: 'p1',
          category: 'SALARY',
          type: 'PLANNED',
          name: 'Salaries',
          amount: 5000,
          notes: null,
        },
      ]);

      const result = await service.runMonthlyExpenses(firstOfMonth);

      expect(result.generated).toBe(2);
      expect(prisma.expense.create).toHaveBeenCalledTimes(2);
    });

    it('should not generate on non-1st day', async () => {
      const result = await service.runMonthlyExpenses(new Date(2026, 3, 15));
      expect(result.generated).toBe(0);
    });

    it('should skip if already generated this month', async () => {
      const firstOfMonth = new Date(2026, 3, 1);
      prisma.expense.count.mockResolvedValue(3);

      const result = await service.runMonthlyExpenses(firstOfMonth);

      expect(result.generated).toBe(0);
      expect(prisma.expense.create).not.toHaveBeenCalled();
    });
  });
});
