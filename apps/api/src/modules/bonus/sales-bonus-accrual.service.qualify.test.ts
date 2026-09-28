import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';
import { SALES_ACCRUAL_HOLD_REASON } from './sales-bonus-accrual-hold';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';

const RECEIPT_AT = new Date('2026-09-15T10:00:00.000Z');
const POLICY_FROM = new Date('2020-01-01T00:00:00.000Z');

function classicOrder(totalAmount = 2_000) {
  return {
    id: 'ord1',
    projectId: 'proj1',
    totalAmount,
    paymentType: 'CLASSIC',
    dealId: 'deal1',
    deal: {
      id: 'deal1',
      source: 'SALES',
      sellerId: 'emp-seller',
      sellerAssistantId: 'emp-asst',
    },
  };
}

function stubPoolSync(prisma: MockPrisma): void {
  prisma.order.findUnique.mockResolvedValue({
    id: 'ord1',
    projectId: 'proj1',
    productId: null,
    extensionId: null,
  });
  prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
  prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
  prisma.productBonusPool.upsert.mockResolvedValue({});
}

function paidInvoice(params: {
  id?: string;
  type: string;
  amount: number;
  paidDate?: Date | null;
  payments?: Array<{ paymentDate: Date }>;
  totalAmount?: number;
}) {
  return {
    id: params.id ?? 'inv1',
    type: params.type,
    moneyStatus: 'PAID',
    paidDate: params.paidDate === undefined ? RECEIPT_AT : params.paidDate,
    payments: params.payments ?? [{ paymentDate: RECEIPT_AT }],
    amount: params.amount,
    orderId: 'ord1',
    order: classicOrder(params.totalAmount),
  };
}

describe('SalesBonusAccrualService qualifying product invoice', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    prisma.bonusEntry.findFirst.mockResolvedValue(null);
    prisma.bonusEntry.createMany.mockResolvedValue({ count: 1 });
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      { sellerPercent: 10, assistantPercent: 2, effectiveFrom: POLICY_FROM },
    ]);
    const notifications = {
      create: vi.fn(),
      createMany: vi.fn(),
    } as unknown as NotificationService;
    service = new SalesBonusAccrualService(prisma as never, notifications);
  });

  it('does not accrue a domain invoice and still accrues a later paid product invoice once', async () => {
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice({ type: 'DOMAIN', amount: 2_000 }));
    await service.onInvoicePaid('inv-domain');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();

    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ id: 'inv-product', type: 'DEVELOPMENT', amount: 500 }),
    );
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
    });
    prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    await service.onInvoicePaid('inv-product');
    expect(prisma.bonusEntry.createMany).toHaveBeenCalled();
  });

  it('does not accrue an unrelated service invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice({ type: 'SERVICE', amount: 2_000 }));
    await service.onInvoicePaid('inv-service');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
  });

  it('holds an ambiguous-purpose invoice without accruing', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn');
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice({ type: 'MANUAL', amount: 2_000 }));
    await service.onInvoicePaid('inv-manual');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: SALES_ACCRUAL_HOLD_REASON.AMBIGUOUS_INVOICE_PURPOSE }),
      'Sales bonus accrual held',
    );
    warn.mockRestore();
  });

  it('does not create a second one-time wave when a later product invoice is paid', async () => {
    prisma.bonusEntry.findFirst
      .mockResolvedValueOnce({ id: 'existing-wave' })
      .mockResolvedValueOnce(null);
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ id: 'inv2', type: 'DEVELOPMENT', amount: 2_000 }),
    );
    await service.onInvoicePaid('inv2');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
  });

  it('accrues once when a different qualifying invoice is paid after an unpaid duplicate', async () => {
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ id: 'inv2', type: 'DEVELOPMENT', amount: 500 }),
    );
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
    });
    prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});
    await service.onInvoicePaid('inv2');
    expect(prisma.bonusEntry.createMany).toHaveBeenCalled();
  });

  it('holds an existing insufficient paid invoice instead of accruing or mutating it', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn');
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ type: 'DEVELOPMENT', amount: 100, totalAmount: 2_000 }),
    );
    await service.onInvoicePaid('inv-small');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: SALES_ACCRUAL_HOLD_REASON.INSUFFICIENT_INVOICE_AMOUNT,
        minimumAmount: '240',
      }),
      'Sales bonus accrual held',
    );
    warn.mockRestore();
  });

  it('accrues when the paid invoice equals the combined minimum', async () => {
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ type: 'DEVELOPMENT', amount: 240, totalAmount: 2_000 }),
    );
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'proj1',
      productId: null,
      extensionId: null,
    });
    prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.productBonusPool.upsert.mockResolvedValue({});
    await service.onInvoicePaid('inv-eq');
    expect(prisma.bonusEntry.createMany).toHaveBeenCalled();
  });

  it('snapshots receipt-event rates and the Yerevan earned month', async () => {
    const receiptAt = new Date('2026-03-31T21:00:00.000Z');
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({
        type: 'DEVELOPMENT',
        amount: 500,
        paidDate: receiptAt,
        payments: [{ paymentDate: receiptAt }],
      }),
    );
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
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            earnedPeriod: '2026-04',
            calculationSnapshot: expect.objectContaining({
              sellerPercent: 10,
              assistantPercent: 2,
              receiptEventAt: receiptAt.toISOString(),
              earnedPeriod: '2026-04',
            }),
          }),
        ],
      }),
    );
  });

  it('holds when two active Classic policies share the same effective date', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn');
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      { sellerPercent: 10, assistantPercent: 2, effectiveFrom: POLICY_FROM },
      { sellerPercent: 8, assistantPercent: 2, effectiveFrom: POLICY_FROM },
    ]);
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice({ type: 'DEVELOPMENT', amount: 500 }));
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: SALES_ACCRUAL_HOLD_REASON.AMBIGUOUS_SALES_POLICY }),
      'Sales bonus accrual held',
    );
    warn.mockRestore();
  });

  it('accrues 120000 not 150000 when a later rate change is entered after the receipt date', async () => {
    const receiptAt = new Date('2026-02-10T12:00:00.000Z');
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      {
        sellerPercent: 10,
        assistantPercent: 2,
        effectiveFrom: new Date('2026-02-10T00:00:00.000Z'),
        effectiveTo: new Date('2026-02-15T00:00:00.000Z'),
        isActive: false,
      },
      {
        sellerPercent: 12,
        assistantPercent: 3,
        effectiveFrom: new Date('2026-02-15T00:00:00.000Z'),
        effectiveTo: null,
        isActive: true,
      },
    ]);
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({
        type: 'DEVELOPMENT',
        amount: 200_000,
        totalAmount: 1_000_000,
        paidDate: receiptAt,
        payments: [{ paymentDate: receiptAt }],
      }),
    );
    stubPoolSync(prisma);
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            amount: new Decimal(100_000),
            calculationSnapshot: expect.objectContaining({
              sellerPercent: 10,
              assistantPercent: 2,
            }),
          }),
        ],
      }),
    );
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(20_000) })],
      }),
    );
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(120_000) })],
      }),
    );
  });

  it('keeps a past receipt held when a new policy version starts after that receipt', async () => {
    const receiptAt = new Date('2025-03-15T12:00:00.000Z');
    prisma.salesBonusPolicy.findMany.mockResolvedValue([]);
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({
        type: 'DEVELOPMENT',
        amount: 200_000,
        totalAmount: 1_000_000,
        paidDate: receiptAt,
        payments: [{ paymentDate: receiptAt }],
      }),
    );
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();

    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      {
        sellerPercent: 10,
        assistantPercent: 2,
        effectiveFrom: new Date('2026-09-28T00:00:00.000Z'),
        effectiveTo: null,
      },
    ]);
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
  });

  it('accrues 100000 after reactivation on a receipt after the new version', async () => {
    const receiptAt = new Date('2026-03-05T12:00:00.000Z');
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      {
        sellerPercent: 8,
        assistantPercent: 2,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-03-01T00:00:00.000Z'),
        isActive: false,
      },
      {
        sellerPercent: 8,
        assistantPercent: 2,
        effectiveFrom: new Date('2026-03-02T00:00:00.000Z'),
        effectiveTo: null,
        isActive: true,
      },
    ]);
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({
        type: 'DEVELOPMENT',
        amount: 200_000,
        totalAmount: 1_000_000,
        paidDate: receiptAt,
        payments: [{ paymentDate: receiptAt }],
      }),
    );
    stubPoolSync(prisma);
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(80_000) })],
      }),
    );
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(20_000) })],
      }),
    );
  });

  it('still uses the open v2 rates after a rejected v1 reactivation', async () => {
    const receiptAt = new Date('2026-03-10T12:00:00.000Z');
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      {
        sellerPercent: 8,
        assistantPercent: 2,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-02-15T00:00:00.000Z'),
        isActive: false,
      },
      {
        sellerPercent: 10,
        assistantPercent: 2,
        effectiveFrom: new Date('2026-02-15T00:00:00.000Z'),
        effectiveTo: null,
        isActive: true,
      },
    ]);
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({
        type: 'DEVELOPMENT',
        amount: 200_000,
        totalAmount: 1_000_000,
        paidDate: receiptAt,
        payments: [{ paymentDate: receiptAt }],
      }),
    );
    stubPoolSync(prisma);
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(100_000) })],
      }),
    );
    expect(prisma.bonusEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(20_000) })],
      }),
    );
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ amount: new Decimal(80_000) })],
      }),
    );
  });

  it('does not sum several small invoices to reach the floor', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn');
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ id: 'inv-a', type: 'DEVELOPMENT', amount: 100_000, totalAmount: 1_000_000 }),
    );
    await service.onInvoicePaid('inv-a');
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ id: 'inv-b', type: 'DEVELOPMENT', amount: 100_000, totalAmount: 1_000_000 }),
    );
    await service.onInvoicePaid('inv-b');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: SALES_ACCRUAL_HOLD_REASON.INSUFFICIENT_INVOICE_AMOUNT }),
      'Sales bonus accrual held',
    );
    warn.mockRestore();
  });

  it('holds when the completing receipt is missing instead of using job time', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn');
    prisma.invoice.findUnique.mockResolvedValue(
      paidInvoice({ type: 'DEVELOPMENT', amount: 500, paidDate: null, payments: [] }),
    );
    await service.onInvoicePaid('inv1');
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: SALES_ACCRUAL_HOLD_REASON.MISSING_RECEIPT_EVENT }),
      'Sales bonus accrual held',
    );
    warn.mockRestore();
  });
});
