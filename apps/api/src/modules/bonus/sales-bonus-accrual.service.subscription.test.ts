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

type FindFirstWhere = {
  salesAccrualInvoiceId?: string;
  salesBonusSlot?: { not: null };
  employeeId?: string;
};

function subscriptionInvoice(invoiceId: string) {
  return {
    id: invoiceId,
    type: 'SUBSCRIPTION',
    moneyStatus: 'PAID',
    paidDate: new Date('2026-09-15T10:00:00.000Z'),
    payments: [{ paymentDate: new Date('2026-09-15T10:00:00.000Z') }],
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
        sellerId: 'emp-1',
        sellerAssistantId: 'emp-1',
      },
    },
  };
}

function findFirstForSubscriptionRows(rows: StoredSalesBonus[]) {
  return async ({ where }: { where: FindFirstWhere }) => {
    const match = rows.find((row) => rowMatchesWhere(row, where));
    return match ? { id: `${match.orderId}-${match.salesBonusSlot ?? 'unslotted'}` } : null;
  };
}

function rowMatchesWhere(row: StoredSalesBonus, where: FindFirstWhere): boolean {
  if (row.type !== 'SALES' || row.orderId !== 'ord-sub') {
    return false;
  }
  if (
    where.salesAccrualInvoiceId != null &&
    row.salesAccrualInvoiceId !== where.salesAccrualInvoiceId
  ) {
    return false;
  }
  if (where.salesBonusSlot != null && row.salesBonusSlot == null) {
    return false;
  }
  if (where.employeeId != null && row.employeeId !== where.employeeId) {
    return false;
  }
  return true;
}

function stubPoolLookups(prisma: MockPrisma) {
  prisma.order.findUnique.mockResolvedValue({
    id: 'ord-sub',
    projectId: 'proj1',
    productId: null,
    extensionId: null,
  });
  prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
  prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
  prisma.productBonusPool.upsert.mockResolvedValue({});
}

function createSlotStore(seed: StoredSalesBonus[]) {
  const rows = [...seed];
  const createMany = async ({
    data,
    skipDuplicates,
  }: {
    data: StoredSalesBonus[];
    skipDuplicates?: boolean;
  }) => {
    let count = 0;
    for (const entry of data) {
      const taken =
        entry.salesBonusSlot != null &&
        rows.some(
          (row) =>
            row.orderId === entry.orderId &&
            row.type === 'SALES' &&
            row.salesBonusSlot === entry.salesBonusSlot,
        );
      if (taken) {
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

describe('SalesBonusAccrualService subscription routing', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    const notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new SalesBonusAccrualService(prisma as never, notifications);
  });

  it('does not take the first-month path when replaying an unslotted recurring invoice', async () => {
    const rows: StoredSalesBonus[] = [
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: 'SELLER',
        salesAccrualInvoiceId: 'inv-1',
      },
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: 'ASSISTANT',
        salesAccrualInvoiceId: 'inv-1',
      },
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: null,
        salesAccrualInvoiceId: 'inv-2',
      },
    ];
    prisma.bonusEntry.findFirst.mockImplementation(findFirstForSubscriptionRows(rows));
    prisma.invoice.findUnique.mockResolvedValue(subscriptionInvoice('inv-2'));
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      {
        sellerPercent: 5,
        assistantPercent: 1,
        effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
      },
    ]);

    await service.onInvoicePaid('inv-2');

    expect(prisma.salesBonusPolicy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentModel: 'SUBSCRIPTION_RECURRING' }),
      }),
    );
    expect(prisma.salesBonusPolicy.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentModel: 'SUBSCRIPTION_FIRST_MONTH' }),
      }),
    );
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
  });

  it('adds a missing first-month Assistant on the original invoice without duplicating Seller', async () => {
    const store = createSlotStore([
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: 'SELLER',
        salesAccrualInvoiceId: 'inv-1',
      },
    ]);
    prisma.bonusEntry.findFirst.mockImplementation(findFirstForSubscriptionRows(store.rows));
    prisma.bonusEntry.createMany.mockImplementation(store.createMany);
    prisma.invoice.findUnique.mockResolvedValue({
      ...subscriptionInvoice('inv-1'),
      amount: 100_000,
    });
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      {
        sellerPercent: 40,
        assistantPercent: 10,
        effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
      },
    ]);
    stubPoolLookups(prisma);

    await service.onInvoicePaid('inv-1');

    expect(prisma.salesBonusPolicy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentModel: 'SUBSCRIPTION_FIRST_MONTH' }),
      }),
    );
    expect(store.rows.filter((row) => row.salesBonusSlot === 'SELLER')).toHaveLength(1);
    expect(store.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'emp-1',
          salesBonusSlot: 'ASSISTANT',
          salesAccrualInvoiceId: 'inv-1',
        }),
      ]),
    );
  });
});
