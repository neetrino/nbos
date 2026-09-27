import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';

type StoredSalesBonus = {
  employeeId: string;
  orderId: string;
  type: string;
  salesBonusSlot: 'SELLER' | 'ASSISTANT' | null;
  salesAccrualInvoiceId: string | null;
};

type CreateManyArgs = {
  data: StoredSalesBonus[];
  skipDuplicates?: boolean;
};

function salesSlotTaken(existing: StoredSalesBonus[], next: StoredSalesBonus): boolean {
  if (next.type !== 'SALES' || next.salesBonusSlot == null) {
    return false;
  }
  return existing.some(
    (row) =>
      row.type === 'SALES' &&
      row.orderId === next.orderId &&
      row.salesBonusSlot === next.salesBonusSlot,
  );
}

function classicDualRoleInvoice() {
  return {
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
        sellerId: 'emp-1',
        sellerAssistantId: 'emp-1',
      },
    },
  };
}

function createSlotStore(seed: StoredSalesBonus[]) {
  const rows = [...seed];
  const createMany = async ({ data, skipDuplicates }: CreateManyArgs) => {
    let count = 0;
    for (const entry of data) {
      if (salesSlotTaken(rows, entry)) {
        if (skipDuplicates) {
          continue;
        }
        throw { code: 'P2002' };
      }
      rows.push(entry);
      count += 1;
    }
    return { count };
  };
  return { rows, createMany };
}

describe('SalesBonusAccrualService slotted replay', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    prisma.bonusEntry.findFirst.mockResolvedValue(null);
    const notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new SalesBonusAccrualService(prisma as never, notifications);
  });

  it('creates the missing Assistant and does not duplicate Seller', async () => {
    const store = createSlotStore([
      {
        employeeId: 'emp-1',
        orderId: 'ord1',
        type: 'SALES',
        salesBonusSlot: 'SELLER',
        salesAccrualInvoiceId: 'inv1',
      },
    ]);
    prisma.bonusEntry.createMany.mockImplementation(store.createMany);
    prisma.invoice.findUnique.mockResolvedValue(classicDualRoleInvoice());
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
    prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    await service.onInvoicePaid('inv1');

    expect(store.rows).toHaveLength(2);
    expect(store.rows.filter((row) => row.salesBonusSlot === 'SELLER')).toHaveLength(1);
    expect(store.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'emp-1',
          salesBonusSlot: 'SELLER',
          salesAccrualInvoiceId: 'inv1',
        }),
        expect.objectContaining({
          employeeId: 'emp-1',
          salesBonusSlot: 'ASSISTANT',
          salesAccrualInvoiceId: 'inv1',
        }),
      ]),
    );
  });
});
