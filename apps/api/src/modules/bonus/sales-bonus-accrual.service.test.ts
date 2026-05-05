import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('SalesBonusAccrualService', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;

  beforeEach(() => {
    prisma = createMockPrisma();
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
    prisma.bonusEntry.findMany.mockResolvedValue([]);
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
        }),
      }),
    );
    expect(prisma.productBonusPool.upsert).toHaveBeenCalled();
  });

  it('skips when seller slot already exists for order', async () => {
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
    prisma.bonusEntry.findMany.mockResolvedValue([{ salesBonusSlot: 'SELLER' }]);

    await service.onInvoicePaid('inv1');

    expect(prisma.bonusEntry.create).not.toHaveBeenCalled();
  });
});
