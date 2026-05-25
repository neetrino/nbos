import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { InvoicesService } from './invoices.service';

describe('InvoicesService create', () => {
  let service: InvoicesService;
  let prisma: MockPrisma;

  const operationalJournal = {
    appendInvoiceCardAccrualLine: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    operationalJournal.appendInvoiceCardAccrualLine.mockClear();
    service = new InvoicesService(
      prisma as never,
      { handle: vi.fn() } as never,
      operationalJournal as never,
    );
  });

  it('generates code INV-YYYY-NNNN', async () => {
    const createdInvoice = {
      id: '1',
      code: 'INV-2026-0001',
      amount: 50000,
      payments: [],
      _count: { payments: 0 },
    };
    prisma.invoice.create.mockResolvedValue(createdInvoice);
    prisma.invoice.findUnique.mockResolvedValue(createdInvoice);

    const result = await service.create({
      projectId: 'p1',
      amount: 50000,
      type: 'PREPAYMENT',
    });
    expect(result.code).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(prisma.invoice.count).not.toHaveBeenCalled();
  });

  it('inherits tax status from order when orderId is provided', async () => {
    prisma.order.findUnique.mockResolvedValue({
      taxStatus: 'TAX_FREE',
      paymentType: 'CLASSIC',
      totalAmount: 500000,
    });
    prisma.invoice.count.mockResolvedValue(0);
    const createdInvoice = {
      id: '2',
      code: 'INV-2026-0002',
      taxStatus: 'TAX_FREE',
      amount: 50000,
      payments: [],
      _count: { payments: 0 },
    };
    prisma.invoice.create.mockResolvedValue(createdInvoice);
    prisma.invoice.findUnique.mockResolvedValue(createdInvoice);

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

  it('rejects invoices without positive amount', async () => {
    await expect(
      service.create({
        projectId: 'p1',
        amount: 0,
        type: 'PREPAYMENT',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects invoices without a project context', async () => {
    await expect(
      service.create({
        projectId: '',
        amount: 50000,
        type: 'PREPAYMENT',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects first classic order invoice below 10% of order total', async () => {
    prisma.order.findUnique.mockResolvedValue({
      taxStatus: 'TAX',
      paymentType: 'CLASSIC',
      totalAmount: 500000,
    });
    prisma.invoice.count.mockResolvedValue(0);

    await expect(
      service.create({
        orderId: 'ord-1',
        projectId: 'p1',
        amount: 49999,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('allows second classic order invoice below 10% of order total', async () => {
    prisma.order.findUnique.mockResolvedValue({
      taxStatus: 'TAX',
      paymentType: 'CLASSIC',
      totalAmount: 500000,
    });
    prisma.invoice.count.mockResolvedValue(1);
    const createdInvoice = {
      id: '3',
      code: 'INV-2026-0003',
      taxStatus: 'TAX',
      amount: 1000,
      payments: [],
      _count: { payments: 0 },
    };
    prisma.invoice.create.mockResolvedValue(createdInvoice);
    prisma.invoice.findUnique.mockResolvedValue(createdInvoice);

    await service.create({
      orderId: 'ord-1',
      projectId: 'p1',
      amount: 1000,
      type: 'DEVELOPMENT',
    });

    expect(prisma.invoice.create).toHaveBeenCalled();
  });

  it('rejects first subscription invoice below monthly amount', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      taxStatus: 'TAX',
      baseMonthlyAmount: 50000,
    });
    prisma.invoice.count.mockResolvedValue(0);

    await expect(
      service.create({
        subscriptionId: 'sub-1',
        projectId: 'p1',
        amount: 49999,
        type: 'SUBSCRIPTION',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('skips classic 10% rule for subscription payment type orders', async () => {
    prisma.order.findUnique.mockResolvedValue({
      taxStatus: 'TAX',
      paymentType: 'SUBSCRIPTION',
      totalAmount: 1_000_000,
    });
    prisma.invoice.count.mockResolvedValue(0);
    const createdInvoice = {
      id: '4',
      code: 'INV-2026-0004',
      taxStatus: 'TAX',
      amount: 100,
      payments: [],
      _count: { payments: 0 },
    };
    prisma.invoice.create.mockResolvedValue(createdInvoice);
    prisma.invoice.findUnique.mockResolvedValue(createdInvoice);

    await service.create({
      orderId: 'ord-sub',
      projectId: 'p1',
      amount: 100,
      type: 'DEVELOPMENT',
    });

    expect(prisma.invoice.create).toHaveBeenCalled();
  });
});
