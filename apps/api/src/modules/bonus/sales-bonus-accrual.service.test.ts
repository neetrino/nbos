import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';

describe('SalesBonusAccrualService', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;
  let notifications: NotificationService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    prisma.bonusEntry.findFirst.mockResolvedValue(null);
    prisma.bonusEntry.createMany.mockResolvedValue({ count: 1 });
    notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new SalesBonusAccrualService(prisma as never, notifications);
  });

  it('does nothing when invoice is not PAID', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      moneyStatus: 'AWAITING_PAYMENT',
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
      moneyStatus: 'PAID',
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

    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: [
          expect.objectContaining({
            employeeId: 'emp-seller',
            orderId: 'ord1',
            projectId: 'proj1',
            dealId: 'deal1',
            type: 'SALES',
            status: 'INCOMING',
            salesBonusSlot: 'SELLER',
            salesAccrualInvoiceId: 'inv1',
          }),
        ],
      }),
    );
    expect(prisma.productBonusPool.upsert).toHaveBeenCalled();
  });

  it('skips classic accrual when a slotted SALES bonus already exists', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      moneyStatus: 'PAID',
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

    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.findFirst).not.toHaveBeenCalled();
  });

  it('uses first-month policy on first subscription paid invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-a',
      moneyStatus: 'PAID',
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
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledTimes(1);
  });

  it('skips recurring accrual when invoice employee rows already exist', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-b',
      moneyStatus: 'PAID',
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
      .mockResolvedValue({ id: 'existing' });
    prisma.salesBonusPolicy.findFirst.mockResolvedValue({
      sellerPercent: 5,
      assistantPercent: 1,
    });

    await service.onInvoicePaid('inv-b');

    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
  });

  it('accrues recurring subscription bonus on later paid invoices', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-b',
      moneyStatus: 'PAID',
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
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.bonusEntry.createMany.mockResolvedValue({ count: 2 });
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
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            salesBonusSlot: null,
            salesAccrualInvoiceId: 'inv-b',
            employeeId: 'emp-seller',
          }),
          expect.objectContaining({
            salesBonusSlot: null,
            salesAccrualInvoiceId: 'inv-b',
            employeeId: 'emp-asst',
          }),
        ]),
      }),
    );
  });
});
