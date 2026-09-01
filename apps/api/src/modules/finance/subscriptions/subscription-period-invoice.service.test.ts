import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { SUBSCRIPTION_PERIOD_INVOICE_ERROR } from './subscription-period-invoice-month';
import { SubscriptionPeriodInvoiceService } from './subscription-period-invoice.service';

const AS_OF = new Date('2026-09-15T10:00:00+04:00');
const INACTIVE_STATUSES = ['PENDING', 'ON_HOLD', 'CANCELLED', 'COMPLETED'] as const;
const LATE_DEV_TYPES = ['DEV_ONLY', 'DEV_AND_MAINTENANCE'] as const;

const idleProduct = {
  deadline: null,
  status: 'DONE',
  deliveryResolution: 'DONE',
  extensions: [],
};

const lateDevProduct = {
  deadline: new Date(2026, 3, 1),
  status: 'DEVELOPMENT',
  deliveryResolution: null,
  extensions: [],
};

function mockSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    code: 'SUB-2026-0001',
    projectId: 'proj-1',
    type: 'MAINTENANCE_ONLY',
    amount: 50000,
    coverageMonthCount: 1,
    taxStatus: 'TAX_FREE',
    billingDay: 15,
    billingStartDate: new Date('2026-01-01T00:00:00+04:00'),
    status: 'ACTIVE',
    termMonths: null,
    endDate: null,
    project: { id: 'proj-1', code: 'P-1', name: 'Test', companyId: null, company: null },
    product: idleProduct,
    ...overrides,
  };
}

function coverageRow(startMonth: string, monthCount = 1) {
  return {
    subscriptionId: 'sub-1',
    coverageStartMonth: startMonth,
    coverageMonthCount: monthCount,
    createdAt: new Date(`${startMonth}-01T00:00:00.000Z`),
  };
}

function queryRawSql(prisma: MockPrisma): string {
  return prisma.$queryRaw.mock.calls.map((call) => String(call[0])).join('\n');
}

describe('SubscriptionPeriodInvoiceService', () => {
  let service: SubscriptionPeriodInvoiceService;
  let prisma: MockPrisma;
  const invoicesService = { findById: vi.fn() };

  beforeEach(() => {
    prisma = createMockPrisma();
    invoicesService.findById.mockReset();
    invoicesService.findById.mockResolvedValue({ id: 'inv-1', code: 'INV-2026-0001' });
    service = new SubscriptionPeriodInvoiceService(prisma as never, invoicesService as never);
    prisma.$queryRaw.mockResolvedValue([{ id: 'sub-1', next_value: 1 }]);
    prisma.invoice.create.mockResolvedValue({ id: 'inv-1', code: 'INV-2026-0001' });
  });

  it('creates a billing invoice for an uncovered month inside a locked transaction', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription());
    prisma.invoice.findMany.mockResolvedValue([]);

    const result = await service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF);

    expect(result).toEqual([{ id: 'inv-1', code: 'INV-2026-0001' }]);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(queryRawSql(prisma)).toContain('FOR UPDATE');
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionId: 'sub-1',
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-09',
          coverageMonthCount: 1,
          amount: 50000,
        }),
      }),
    );
  });

  it('rejects a missing subscription', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.subscription.findUnique.mockResolvedValue(null);
    await expect(
      service.create('missing', { coverageMonth: '2026-09' }, AS_OF),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each(INACTIVE_STATUSES)('rejects a %s subscription', async (status) => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription({ status }));
    await expect(
      service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF)).rejects.toThrow(
      SUBSCRIPTION_PERIOD_INVOICE_ERROR.NOT_ACTIVE,
    );
  });

  it('rejects a month that already has coverage', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription());
    prisma.invoice.findMany.mockResolvedValue([coverageRow('2026-09')]);
    await expect(service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF)).rejects.toThrow(
      SUBSCRIPTION_PERIOD_INVOICE_ERROR.ALREADY_COVERED,
    );
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects a yearly window that overlaps an existing 12-month card', async () => {
    prisma.subscription.findUnique.mockResolvedValue(
      mockSubscription({ coverageMonthCount: 12, amount: 120_000 }),
    );
    prisma.invoice.findMany.mockResolvedValue([coverageRow('2026-01', 12)]);
    await expect(service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF)).rejects.toThrow(
      SUBSCRIPTION_PERIOD_INVOICE_ERROR.ALREADY_COVERED,
    );
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects when remaining term is shorter than the charge window', async () => {
    prisma.subscription.findUnique.mockResolvedValue(
      mockSubscription({ coverageMonthCount: 12, termMonths: 6, amount: 120_000 }),
    );
    prisma.invoice.findMany.mockResolvedValue([]);
    await expect(service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF)).rejects.toThrow(
      SUBSCRIPTION_PERIOD_INVOICE_ERROR.TERM_REMAINING,
    );
  });

  it('rejects when the term is already fully covered', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription({ termMonths: 1 }));
    prisma.invoice.findMany.mockResolvedValue([coverageRow('2026-08')]);
    await expect(service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF)).rejects.toThrow(
      SUBSCRIPTION_PERIOD_INVOICE_ERROR.TERM_COMPLETE,
    );
  });

  it.each(LATE_DEV_TYPES)(
    'rejects %s billing while the product is past deadline and undelivered',
    async (type) => {
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscription({ type, product: lateDevProduct }),
      );
      prisma.invoice.findMany.mockResolvedValue([]);
      await expect(service.create('sub-1', { coverageMonth: '2026-09' }, AS_OF)).rejects.toThrow(
        SUBSCRIPTION_PERIOD_INVOICE_ERROR.DELIVERY_PAUSE,
      );
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    },
  );

  it('issues September when start is the 20th and billing day is the 15th', async () => {
    prisma.subscription.findUnique.mockResolvedValue(
      mockSubscription({
        billingStartDate: new Date('2026-09-20T00:00:00+04:00'),
        billingDay: 15,
      }),
    );
    prisma.invoice.findMany.mockResolvedValue([]);

    await service.create(
      'sub-1',
      { coverageMonth: '2026-09' },
      new Date('2026-09-21T10:00:00+04:00'),
    );

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverageStartMonth: '2026-09' }),
      }),
    );
  });

  it('rejects a month beyond the current Yerevan month plus 12', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription());
    prisma.invoice.findMany.mockResolvedValue([]);
    await expect(service.create('sub-1', { coverageMonth: '2027-10' }, AS_OF)).rejects.toThrow(
      SUBSCRIPTION_PERIOD_INVOICE_ERROR.TOO_FAR,
    );
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('creates a separate card for each selected month in one transaction', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription());
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.invoice.create.mockImplementation(async ({ data }) => ({
      id: `inv-${data.coverageStartMonth}`,
      code: `INV-${data.coverageStartMonth}`,
    }));
    invoicesService.findById.mockImplementation(async (id: string) => ({ id, code: id.replace('inv-', 'INV-') }));

    const result = await service.create(
      'sub-1',
      { coverageMonths: ['2026-10', '2026-11', '2026-12'] },
      AS_OF,
    );

    expect(prisma.invoice.create).toHaveBeenCalledTimes(3);
    expect(result).toEqual([
      { id: 'inv-2026-10', code: 'INV-2026-10' },
      { id: 'inv-2026-11', code: 'INV-2026-11' },
      { id: 'inv-2026-12', code: 'INV-2026-12' },
    ]);
  });

  it('rejects a batch that exceeds remaining term', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSubscription({ termMonths: 2 }));
    prisma.invoice.findMany.mockResolvedValue([]);
    await expect(
      service.create('sub-1', { coverageMonths: ['2026-09', '2026-10', '2026-11'] }, AS_OF),
    ).rejects.toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.TERM_COMPLETE);
  });

  it('rejects selected yearly starts that overlap each other', async () => {
    prisma.subscription.findUnique.mockResolvedValue(
      mockSubscription({ coverageMonthCount: 12, amount: 120_000 }),
    );
    prisma.invoice.findMany.mockResolvedValue([]);
    await expect(
      service.create('sub-1', { coverageMonths: ['2026-09', '2026-10'] }, AS_OF),
    ).rejects.toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.SELECTED_OVERLAP);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});
