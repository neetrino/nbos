import { describe, it, expect, beforeEach } from 'vitest';
import type { SubscriptionBillingFrequencyEnum } from '@nbos/database';
import { BillingService } from './billing.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

const idleProduct = {
  deadline: null,
  status: 'DONE',
  deliveryResolution: 'DONE',
  extensions: [],
};

type MockBillableSubscription = {
  id: string;
  code: string;
  projectId: string;
  type: string;
  amount: number;
  billingFrequency: SubscriptionBillingFrequencyEnum;
  coverageMonthCount: number;
  taxStatus: string;
  billingDay: number;
  billingStartDate: Date;
  status: string;
  termMonths: number | null;
  endDate: Date | null;
  project: {
    id: string;
    code: string;
    name: string;
    companyId: string | null;
    company: { name: string; legalName: string | null; taxId: string | null } | null;
  };
  product: typeof idleProduct;
};

type MockCoverageInvoiceRow = {
  subscriptionId: string;
  coverageStartMonth: string | null;
  coverageMonthCount: number | null;
  createdAt: Date;
};

function mockBillableSubscription(
  overrides: Partial<MockBillableSubscription> = {},
): MockBillableSubscription {
  return {
    id: 'sub-1',
    code: 'SUB-2026-0001',
    projectId: 'proj-1',
    type: 'MAINTENANCE_ONLY',
    amount: 5000,
    billingFrequency: 'MONTHLY',
    coverageMonthCount: 1,
    taxStatus: 'TAX_FREE',
    billingDay: 15,
    billingStartDate: new Date(2020, 0, 1),
    status: 'ACTIVE',
    termMonths: null,
    endDate: null,
    project: { id: 'proj-1', code: 'P-2026-0001', name: 'Test', companyId: null, company: null },
    product: idleProduct,
    ...overrides,
  };
}

function mockCoverageInvoiceRow(
  overrides: Partial<MockCoverageInvoiceRow> = {},
): MockCoverageInvoiceRow {
  return {
    subscriptionId: 'sub-1',
    coverageStartMonth: '2026-03',
    coverageMonthCount: 1,
    createdAt: new Date(2026, 2, 15),
    ...overrides,
  };
}

function setupInvoiceCodeGeneration(prisma: MockPrisma): void {
  prisma.$queryRaw.mockResolvedValue([{ next_value: 1 }]);
  prisma.invoice.create.mockResolvedValue({ id: 'inv-1', code: 'INV-2026-0001' });
}

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
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription()]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.totalAmount).toBe(5000);
      expect(result.errors.length).toBe(0);
      expect(result.skippedLateDelivery).toEqual([]);
      expect(result.completedTerm).toEqual([]);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionId: 'sub-1',
            projectId: 'proj-1',
            amount: 5000,
            taxStatus: 'TAX_FREE',
            type: 'SUBSCRIPTION',
            moneyStatus: 'NEW',
            coverageStartMonth: '2026-03',
            coverageMonthCount: 1,
          }),
        }),
      );
    });

    it('should skip when an existing invoice covers the billing month', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription()]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 1,
          createdAt: new Date(2026, 2, 10),
        }),
      ]);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.skippedLateDelivery).toEqual([]);
      expect(result.completedTerm).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('should return empty when no subscriptions match billing day', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.runMonthlyBilling(new Date(2026, 2, 5));

      expect(result.generatedInvoices).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.skippedLateDelivery).toEqual([]);
      expect(result.completedTerm).toEqual([]);
      expect(prisma.invoice.findMany).not.toHaveBeenCalled();
    });

    it('should collect errors without stopping', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          id: 'sub-1',
          code: 'SUB-1',
          projectId: 'p1',
          project: { id: 'p1', code: 'PR-1', name: 'A', companyId: null, company: null },
        }),
        mockBillableSubscription({
          id: 'sub-2',
          code: 'SUB-2',
          projectId: 'p2',
          amount: 200,
          project: { id: 'p2', code: 'PR-2', name: 'B', companyId: null, company: null },
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.$queryRaw.mockResolvedValue([{ next_value: 1 }]);
      prisma.invoice.create
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id: 'inv-2', code: 'INV-2' });

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('SUB-1');
      expect(result.skippedLateDelivery).toEqual([]);
      expect(result.completedTerm).toEqual([]);
    });

    it('uses the target billing date year when generating invoice codes', async () => {
      const targetDate = new Date(2025, 11, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          id: 'sub-legacy',
          code: 'SUB-2025-0008',
          amount: 7500,
          taxStatus: 'TAX',
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.$queryRaw.mockResolvedValue([{ next_value: 1 }]);
      prisma.invoice.create.mockResolvedValue({ id: 'inv-legacy', code: 'INV-2025-0001' });

      await service.runMonthlyBilling(targetDate);

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'INV-2025-0001' }),
        }),
      );
      expect(prisma.invoice.findFirst).not.toHaveBeenCalled();
    });

    it('skips DEV_ONLY invoice when linked product is past deadline and undelivered', async () => {
      const today = new Date(2026, 4, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          id: 'sub-dev',
          code: 'SUB-DEV-1',
          type: 'DEV_ONLY',
          amount: 100_000,
          taxStatus: 'TAX',
          product: {
            deadline: new Date(2026, 3, 1),
            status: 'DEVELOPMENT',
            deliveryResolution: null,
            extensions: [],
          },
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(result.skippedLateDelivery).toEqual([
        { subscriptionCode: 'SUB-DEV-1', projectCode: 'P-2026-0001' },
      ]);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('creates one YEARLY invoice with 12-month coverage when none exists', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          amount: 120_000,
          billingFrequency: 'YEARLY',
          coverageMonthCount: 12,
          billingDay: 15,
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.totalAmount).toBe(120_000);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 120_000,
            coverageStartMonth: '2026-03',
            coverageMonthCount: 12,
          }),
        }),
      );
    });

    it('skips YEARLY billing while the 12-month coverage window is active', async () => {
      const today = new Date(2026, 3, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          amount: 120_000,
          billingFrequency: 'YEARLY',
          coverageMonthCount: 12,
          billingDay: 15,
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 12,
          createdAt: new Date(2026, 2, 15),
        }),
      ]);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('creates a new YEARLY invoice after the prior coverage window ends', async () => {
      const today = new Date(2027, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          amount: 120_000,
          billingFrequency: 'YEARLY',
          coverageMonthCount: 12,
          billingDay: 15,
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 12,
          createdAt: new Date(2026, 2, 15),
        }),
      ]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.totalAmount).toBe(120_000);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2027-03',
            coverageMonthCount: 12,
          }),
        }),
      );
    });

    it('creates a MONTHLY invoice when no invoice covers the billing month', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription({ amount: 7500 })]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 7500,
            coverageStartMonth: '2026-03',
            coverageMonthCount: 1,
          }),
        }),
      );
    });

    it('creates one CUSTOM invoice with prepaid coverage and skips the next month', async () => {
      const subscription = mockBillableSubscription({
        amount: 40_000,
        billingFrequency: 'CUSTOM',
        coverageMonthCount: 4,
        billingDay: 15,
      });
      prisma.subscription.findMany.mockResolvedValueOnce([subscription]);
      prisma.invoice.findMany.mockResolvedValueOnce([]);
      setupInvoiceCodeGeneration(prisma);

      const firstRun = await service.runMonthlyBilling(new Date(2026, 2, 15));

      expect(firstRun.generatedInvoices).toBe(1);
      expect(firstRun.totalAmount).toBe(40_000);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 40_000,
            coverageStartMonth: '2026-03',
            coverageMonthCount: 4,
          }),
        }),
      );

      prisma.subscription.findMany.mockResolvedValueOnce([subscription]);
      prisma.invoice.findMany.mockResolvedValueOnce([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 4,
          createdAt: new Date(2026, 2, 15),
        }),
      ]);

      const secondRun = await service.runMonthlyBilling(new Date(2026, 3, 15));

      expect(secondRun.generatedInvoices).toBe(0);
      expect(prisma.invoice.create).toHaveBeenCalledTimes(1);
    });

    it('loads active subscriptions without filtering by billingDay', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      await service.runMonthlyBilling(new Date('2026-03-15T12:00:00+04:00'));

      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            billingStartDate: { lte: expect.any(Date) },
          }),
        }),
      );
      expect(prisma.subscription.findMany.mock.calls[0]?.[0]?.where?.billingDay).toBeUndefined();
    });

    it('keeps day-1 Tax without company requisites in New', async () => {
      const today = new Date('2026-03-30T11:00:00+04:00');
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          billingDay: 1,
          taxStatus: 'TAX',
          project: {
            id: 'proj-1',
            code: 'P-2026-0001',
            name: 'Test',
            companyId: null,
            company: null,
          },
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      await service.runMonthlyBilling(today);

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2026-04',
            moneyStatus: 'NEW',
          }),
        }),
      );
    });

    it('creates a day-1 invoice for the next month on the penultimate weekday', async () => {
      const today = new Date('2026-03-30T11:00:00+04:00');
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription({ billingDay: 1 })]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2026-04',
            moneyStatus: 'AWAITING_PAYMENT',
            dueDate: new Date('2026-04-06T00:00:00+04:00'),
          }),
        }),
      );
    });

    it('does not create day-3 early; bills March on 30 March', async () => {
      const today = new Date('2026-03-30T11:00:00+04:00');
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription({ billingDay: 3 })]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      await service.runMonthlyBilling(today);

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2026-03',
            dueDate: new Date('2026-04-04T00:00:00+04:00'),
          }),
        }),
      );
    });

    it('allows billingStartDate on 1 April when issuing on 30 March', async () => {
      const today = new Date('2026-03-30T11:00:00+04:00');
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          billingDay: 1,
          billingStartDate: new Date('2026-04-01T00:00:00+04:00'),
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ coverageStartMonth: '2026-04' }),
        }),
      );
    });

    it('keeps pay-day + 5 when the 1st-of-month wave runs before billingDay', async () => {
      const today = new Date('2026-04-02T11:00:00+04:00');
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({ billingDay: 15 }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      await service.runMonthlyBilling(today);

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2026-04',
            dueDate: new Date('2026-04-20T00:00:00+04:00'),
          }),
        }),
      );
    });

    it('anchors dueDate to the issue day when billing is late', async () => {
      const today = new Date('2026-04-16T11:00:00+04:00');
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({ billingDay: 15 }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      await service.runMonthlyBilling(today);

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2026-04',
            dueDate: new Date('2026-04-21T00:00:00+04:00'),
          }),
        }),
      );
    });

    it('skips billing for legacy invoices without coverage fields in the billing month', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription()]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: null,
          coverageMonthCount: null,
          createdAt: new Date(2026, 2, 10),
        }),
      ]);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('loads only SUBSCRIPTION invoices for coverage dedup', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription()]);
      prisma.invoice.findMany.mockResolvedValue([]);
      setupInvoiceCodeGeneration(prisma);

      await service.runMonthlyBilling(today);

      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: {
          subscriptionId: { in: ['sub-1'] },
          type: 'SUBSCRIPTION',
        },
        select: {
          subscriptionId: true,
          coverageStartMonth: true,
          coverageMonthCount: true,
          createdAt: true,
        },
      });
    });

    it('completes a fixed-term subscription when covered months meet termMonths', async () => {
      const today = new Date(2026, 6, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          code: 'SUB-TERM-1',
          termMonths: 6,
          endDate: null,
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-01',
          coverageMonthCount: 6,
          createdAt: new Date(2026, 0, 15),
        }),
      ]);
      prisma.subscription.update.mockResolvedValue({});

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(result.completedTerm).toEqual([
        { subscriptionCode: 'SUB-TERM-1', projectCode: 'P-2026-0001' },
      ]);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'COMPLETED',
          endDate: new Date(2026, 6, 0, 23, 59, 59, 999),
        },
      });
    });

    it('does not complete or bill when late-delivery pause skips a term month', async () => {
      const today = new Date(2026, 4, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({
          code: 'SUB-DEV-TERM',
          type: 'DEV_ONLY',
          termMonths: 6,
          product: {
            deadline: new Date(2026, 3, 1),
            status: 'DEVELOPMENT',
            deliveryResolution: null,
            extensions: [],
          },
        }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-01',
          coverageMonthCount: 3,
          createdAt: new Date(2026, 0, 15),
        }),
      ]);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(result.completedTerm).toEqual([]);
      expect(result.skippedLateDelivery).toEqual([
        { subscriptionCode: 'SUB-DEV-TERM', projectCode: 'P-2026-0001' },
      ]);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('continues billing open-ended subscriptions after many covered months', async () => {
      const today = new Date(2026, 6, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({ termMonths: null }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-01',
          coverageMonthCount: 6,
          createdAt: new Date(2026, 0, 15),
        }),
      ]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.completedTerm).toEqual([]);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('does not generate a second invoice for the month already covered by a linked deal deposit', async () => {
      const today = new Date(2026, 2, 15);
      prisma.subscription.findMany.mockResolvedValue([mockBillableSubscription({ termMonths: 6 })]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 1,
          createdAt: new Date(2026, 2, 15),
        }),
      ]);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(0);
      expect(result.completedTerm).toEqual([]);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('a 6-month term whose linked deposit month is counted completes after five generated invoices (six paid periods total)', async () => {
      const subscription = mockBillableSubscription({ termMonths: 6, billingDay: 15 });
      const covered = [
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 1,
          createdAt: new Date(2026, 2, 15),
        }),
      ];
      prisma.subscription.findMany.mockResolvedValue([subscription]);
      prisma.invoice.findMany.mockImplementation(() => Promise.resolve([...covered]));
      prisma.subscription.update.mockResolvedValue({});

      const billingRuns = [
        { date: new Date(2026, 2, 15), monthKey: '2026-03' },
        { date: new Date(2026, 3, 15), monthKey: '2026-04' },
        { date: new Date(2026, 4, 15), monthKey: '2026-05' },
        { date: new Date(2026, 5, 15), monthKey: '2026-06' },
        { date: new Date(2026, 6, 15), monthKey: '2026-07' },
        { date: new Date(2026, 7, 15), monthKey: '2026-08' },
        { date: new Date(2026, 8, 15), monthKey: '2026-09' },
      ];

      let generatedTotal = 0;
      for (const [index, run] of billingRuns.entries()) {
        setupInvoiceCodeGeneration(prisma);
        const result = await service.runMonthlyBilling(run.date);
        if (result.generatedInvoices === 1) {
          generatedTotal += 1;
          covered.push(
            mockCoverageInvoiceRow({
              coverageStartMonth: run.monthKey,
              coverageMonthCount: 1,
              createdAt: run.date,
            }),
          );
        }
        if (index === billingRuns.length - 1) {
          expect(result.generatedInvoices).toBe(0);
          expect(result.completedTerm).toEqual([
            { subscriptionCode: 'SUB-2026-0001', projectCode: 'P-2026-0001' },
          ]);
        }
      }

      expect(generatedTotal).toBe(5);
      expect(covered).toHaveLength(6);
    });

    it('open-ended subscriptions still bill the next uncovered month after a linked deposit', async () => {
      const today = new Date(2026, 3, 15);
      prisma.subscription.findMany.mockResolvedValue([
        mockBillableSubscription({ termMonths: null }),
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        mockCoverageInvoiceRow({
          coverageStartMonth: '2026-03',
          coverageMonthCount: 1,
          createdAt: new Date(2026, 2, 15),
        }),
      ]);
      setupInvoiceCodeGeneration(prisma);

      const result = await service.runMonthlyBilling(today);

      expect(result.generatedInvoices).toBe(1);
      expect(result.completedTerm).toEqual([]);
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            coverageStartMonth: '2026-04',
            coverageMonthCount: 1,
          }),
        }),
      );
    });
  });
});
