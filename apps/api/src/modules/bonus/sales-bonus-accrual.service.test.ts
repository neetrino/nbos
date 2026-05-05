import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('SalesBonusAccrualService', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    prisma.bonusEntry.findFirst.mockResolvedValue(null);
    service = new SalesBonusAccrualService(prisma as never);
  });

  it('does nothing when invoice is not PAID', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      status: 'WAITING',
      amount: 100,
      orderId: 'ord1',
      order: { id: 'ord1' },
    });

    await service.onInvoicePaid('inv1');

    expect(prisma.salesBonusPolicy.findFirst).not.toHaveBeenCalled();
  });

  it('accrues seller SALES bonus on classic fully paid invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      status: 'PAID',
      amount: 500,
      orderId: 'ord1',
      order: {
        id: 'ord1',
        projectId: 'proj1',
        totalAmount: 2000,
        paymentType: 'CLASSIC',
        dealId: 'deal1',
        deal: {
          id: 'deal1',
          source: 'SALES',
          sellerId: 'emp-seller',
          sellerAssistantId: null,
        },
      },
    });
    prisma.salesBonusPolicy.findFirst.mockResolvedValue({
      sellerPercent: 10,
      assistantPercent: 2,
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
    });
    prisma.bonusEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(200) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    await service.onInvoicePaid('inv1');

    expect(prisma.bonusEntry.create).toHaveBeenCalledTimes(1);
    expect(prisma.bonusEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'emp-seller',
          orderId: 'ord1',
          projectId: 'proj1',
          dealId: 'deal1',
          type: 'SALES',
          status: 'INCOMING',
          salesBonusSlot: 'SELLER',
          salesAccrualInvoiceId: 'inv1',
        }),
      }),
    );
    expect(prisma.productBonusPool.upsert).toHaveBeenCalled();
  });

  it('skips classic accrual when a slotted SALES bonus already exists', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      status: 'PAID',
      amount: 500,
      orderId: 'ord1',
      order: {
        id: 'ord1',
        projectId: 'proj1',
        totalAmount: 2000,
        paymentType: 'CLASSIC',
        dealId: 'deal1',
        deal: {
          id: 'deal1',
          source: 'SALES',
          sellerId: 'emp-seller',
          sellerAssistantId: null,
        },
      },
    });
    prisma.bonusEntry.findFirst.mockResolvedValue({ id: 'existing-bonus' });

    await service.onInvoicePaid('inv1');

    expect(prisma.bonusEntry.create).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.findFirst).not.toHaveBeenCalled();
  });

  it('uses first-month policy on first subscription paid invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-a',
      status: 'PAID',
      amount: 100_000,
      orderId: 'ord-sub',
      order: {
        id: 'ord-sub',
        projectId: 'proj1',
        totalAmount: 1_200_000,
        paymentType: 'SUBSCRIPTION',
        dealId: 'deal1',
        deal: {
          id: 'deal1',
          source: 'CLIENT',
          sellerId: 'emp-seller',
          sellerAssistantId: null,
        },
      },
    });
    prisma.salesBonusPolicy.findFirst.mockResolvedValue({
      sellerPercent: 40,
      assistantPercent: 10,
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-sub',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
    });
    prisma.bonusEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    await service.onInvoicePaid('inv-a');

    expect(prisma.salesBonusPolicy.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentModel: 'SUBSCRIPTION_FIRST_MONTH' }),
      }),
    );
    expect(prisma.bonusEntry.create).toHaveBeenCalledTimes(1);
    expect(prisma.bonusEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          salesBonusSlot: 'SELLER',
          salesAccrualInvoiceId: 'inv-a',
        }),
      }),
    );
  });

  it('accrues recurring subscription bonus on later paid invoices', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-b',
      status: 'PAID',
      amount: 50_000,
      orderId: 'ord-sub',
      order: {
        id: 'ord-sub',
        projectId: 'proj1',
        totalAmount: 1_200_000,
        paymentType: 'SUBSCRIPTION',
        dealId: 'deal1',
        deal: {
          id: 'deal1',
          source: 'CLIENT',
          sellerId: 'emp-seller',
          sellerAssistantId: 'emp-asst',
        },
      },
    });
    prisma.bonusEntry.findFirst
      .mockResolvedValueOnce({ id: 'first-month-row' })
      .mockResolvedValueOnce(null);
    prisma.salesBonusPolicy.findFirst.mockResolvedValue({
      sellerPercent: 5,
      assistantPercent: 1,
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-sub',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
    });
    prisma.bonusEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    await service.onInvoicePaid('inv-b');

    expect(prisma.salesBonusPolicy.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentModel: 'SUBSCRIPTION_RECURRING' }),
      }),
    );
    expect(prisma.bonusEntry.create).toHaveBeenCalledTimes(2);
    expect(prisma.bonusEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          salesBonusSlot: null,
          salesAccrualInvoiceId: 'inv-b',
          employeeId: 'emp-seller',
        }),
      }),
    );
    expect(prisma.bonusEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          salesBonusSlot: null,
          salesAccrualInvoiceId: 'inv-b',
          employeeId: 'emp-asst',
        }),
      }),
    );
  });
});
