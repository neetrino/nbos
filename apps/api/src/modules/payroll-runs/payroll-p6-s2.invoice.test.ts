import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadPaidSalesBonusInvoice } from '../bonus/sales-bonus-accrual-invoice-load';
import { SalesBonusAccrualService } from '../bonus/sales-bonus-accrual.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';
import { buildInvoicePaymentCoverage } from '../finance/invoices/invoice-payment-coverage';
import {
  deriveBaseInvoiceMoneyStatus,
  syncInvoiceMoneyStatusFromPayments,
} from '../finance/invoices/invoice-money-status';
import {
  P6_S2_INVOICE_ACCRUAL_AFTER_1,
  P6_S2_INVOICE_ACCRUAL_AFTER_2,
  P6_S2_INVOICE_AMOUNT,
  P6_S2_INVOICE_ASSISTANT,
  P6_S2_INVOICE_COMBINED,
  P6_S2_INVOICE_PAID_AFTER_1,
  P6_S2_INVOICE_PAID_AFTER_2,
  P6_S2_INVOICE_PAID_AFTER_FINAL,
  P6_S2_INVOICE_RECEIPT_1,
  P6_S2_INVOICE_RECEIPT_2,
  P6_S2_INVOICE_RECEIPT_3,
  P6_S2_INVOICE_REMAINING_AFTER_1,
  P6_S2_INVOICE_REMAINING_AFTER_2,
  P6_S2_INVOICE_REMAINING_AFTER_FINAL,
  P6_S2_INVOICE_SELLER,
} from './payroll-p6-s2-expected.amounts';

const RECEIPT_AT = new Date('2026-09-15T10:00:00.000Z');
const POLICY_FROM = new Date('2020-01-01T00:00:00.000Z');
const FINAL_RECEIPTS = [
  P6_S2_INVOICE_RECEIPT_1,
  P6_S2_INVOICE_RECEIPT_2,
  P6_S2_INVOICE_RECEIPT_3,
] as const;

describe('P6-S2 V-19 classic invoice 210000 paid 100000+100000+10000', () => {
  let prisma: MockPrisma;
  let service: SalesBonusAccrualService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    prisma.bonusEntry.findFirst.mockResolvedValue(null);
    prisma.bonusEntry.createMany.mockResolvedValue({ count: 1 });
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      { sellerPercent: 8, assistantPercent: 2, effectiveFrom: POLICY_FROM, effectiveTo: null },
    ]);
    const notifications = {
      create: vi.fn(),
      createMany: vi.fn(),
    } as unknown as NotificationService;
    service = new SalesBonusAccrualService(prisma as never, notifications);
  });

  it('leaves remaining 110000 and accrual 0 after the first 100000', async () => {
    const state = receiptState([P6_S2_INVOICE_RECEIPT_1]);
    prisma.invoice.findUnique.mockResolvedValue(invoiceFromState(state));

    const loaded = await loadPaidSalesBonusInvoice(prisma as never, 'inv-210');
    await service.onInvoicePaid('inv-210');

    expect(state.coverage.paidAmount.toFixed(2)).toBe(P6_S2_INVOICE_PAID_AFTER_1.toFixed(2));
    expect(state.coverage.outstandingAmount.toFixed(2)).toBe(
      P6_S2_INVOICE_REMAINING_AFTER_1.toFixed(2),
    );
    expect(state.moneyStatus).not.toBe('PAID');
    expect(state.baseStatus).not.toBe('PAID');
    expect(loaded).toBeNull();
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(P6_S2_INVOICE_ACCRUAL_AFTER_1.toFixed(2)).toBe('0.00');
  });

  it('does not accrue on 200000 of 210000 after the second 100000', async () => {
    const state = receiptState([P6_S2_INVOICE_RECEIPT_1, P6_S2_INVOICE_RECEIPT_2]);
    prisma.invoice.findUnique.mockResolvedValue(invoiceFromState(state));

    const loaded = await loadPaidSalesBonusInvoice(prisma as never, 'inv-210');
    await service.onInvoicePaid('inv-210');

    expect(state.coverage.paidAmount.toFixed(2)).toBe(P6_S2_INVOICE_PAID_AFTER_2.toFixed(2));
    expect(state.coverage.outstandingAmount.toFixed(2)).toBe(
      P6_S2_INVOICE_REMAINING_AFTER_2.toFixed(2),
    );
    expect(state.moneyStatus).not.toBe('PAID');
    expect(state.baseStatus).not.toBe('PAID');
    expect(loaded).toBeNull();
    expect(prisma.bonusEntry.createMany).not.toHaveBeenCalled();
    expect(P6_S2_INVOICE_ACCRUAL_AFTER_2.toFixed(2)).toBe('0.00');
    expect(state.coverage.paidAmount.toFixed(2)).not.toBe(P6_S2_INVOICE_AMOUNT.toFixed(2));
  });

  it('is PAID after the final 10000 and accrues 16800 seller plus 4200 assistant', async () => {
    const state = receiptState(FINAL_RECEIPTS);
    prisma.invoice.findUnique.mockResolvedValue(invoiceFromState(state));
    stubAccrualWrites(prisma);

    await service.onInvoicePaid('inv-210');
    const created = createdSalesAmounts(prisma);

    expect(state.coverage.paidAmount.toFixed(2)).toBe(P6_S2_INVOICE_PAID_AFTER_FINAL.toFixed(2));
    expect(state.coverage.outstandingAmount.toFixed(2)).toBe(
      P6_S2_INVOICE_REMAINING_AFTER_FINAL.toFixed(2),
    );
    expect(state.moneyStatus).toBe('PAID');
    expect(state.baseStatus).toBe('PAID');
    expect(created.seller).toBe(P6_S2_INVOICE_SELLER.toFixed(2));
    expect(created.assistant).toBe(P6_S2_INVOICE_ASSISTANT.toFixed(2));
    expect(P6_S2_INVOICE_COMBINED.toFixed(2)).toBe('21000.00');
  });
});

type ReceiptState = ReturnType<typeof receiptState>;

function receiptState(receipts: readonly Decimal[]) {
  const amount = P6_S2_INVOICE_AMOUNT.toNumber();
  const coverage = buildInvoicePaymentCoverage(invoiceWithReceipts(receipts));
  const emptyStatus = deriveBaseInvoiceMoneyStatus({
    amount,
    paid: 0,
    dueDate: null,
    now: RECEIPT_AT,
  });
  const moneyStatus = syncInvoiceMoneyStatusFromPayments({
    currentMoneyStatus: emptyStatus,
    amount,
    paid: coverage.paidAmount,
    dueDate: null,
    now: RECEIPT_AT,
  });
  return {
    coverage,
    moneyStatus,
    baseStatus: deriveBaseInvoiceMoneyStatus({
      amount,
      paid: coverage.paidAmount,
      dueDate: null,
      now: RECEIPT_AT,
    }),
  };
}

function invoiceWithReceipts(receipts: readonly Decimal[]) {
  return {
    amount: P6_S2_INVOICE_AMOUNT,
    payments: receipts.map((amount) => ({ amount })),
  };
}

function invoiceFromState(state: ReceiptState) {
  return {
    id: 'inv-210',
    type: 'DEVELOPMENT',
    moneyStatus: state.moneyStatus,
    paidDate: state.moneyStatus === 'PAID' ? RECEIPT_AT : null,
    payments: [{ paymentDate: RECEIPT_AT }],
    amount: P6_S2_INVOICE_AMOUNT,
    coverageMonthCount: null,
    orderId: 'ord-210',
    order: classicOrder(),
  };
}

function stubAccrualWrites(prisma: MockPrisma): void {
  prisma.order.findUnique.mockResolvedValue({
    id: 'ord-210',
    projectId: 'proj-210',
    productId: null,
    extensionId: null,
  });
  prisma.bonusEntry.aggregate.mockResolvedValue({ _sum: { amount: null } });
  prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: null } });
  prisma.productBonusPool.upsert.mockResolvedValue({});
}

function createdSalesAmounts(prisma: MockPrisma): { seller?: string; assistant?: string } {
  const rows = prisma.bonusEntry.createMany.mock.calls.flatMap((call) => {
    const arg = call[0] as { data?: Array<{ salesBonusSlot?: string; amount?: unknown }> };
    return arg.data ?? [];
  });
  return {
    seller: moneyFixed(rows.find((row) => row.salesBonusSlot === 'SELLER')?.amount),
    assistant: moneyFixed(rows.find((row) => row.salesBonusSlot === 'ASSISTANT')?.amount),
  };
}

function moneyFixed(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Decimal) return value.toFixed(2);
  return new Decimal(String(value)).toFixed(2);
}

function classicOrder() {
  return {
    id: 'ord-210',
    projectId: 'proj-210',
    totalAmount: P6_S2_INVOICE_AMOUNT,
    paymentType: 'CLASSIC',
    paymentMode: 'STANDARD_PREPAY',
    dealId: 'deal-210',
    deal: {
      id: 'deal-210',
      source: 'SALES',
      amount: P6_S2_INVOICE_AMOUNT,
      sellerId: 'emp-seller',
      sellerAssistantId: 'emp-asst',
    },
  };
}
