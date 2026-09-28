import type { InvoiceMoneyStatusEnum } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { syncInvoiceMoneyStatusFromPayments } from '../finance/invoices/invoice-money-status';
import { PaymentsService } from '../finance/payments/payments.service';
import type { NotificationService } from '../notifications/notification.service';
import {
  P6_S2_INVOICE_AMOUNT,
  P6_S2_INVOICE_RECEIPT_1,
  P6_S2_INVOICE_RECEIPT_2,
  P6_S2_INVOICE_RECEIPT_3,
} from './payroll-p6-s2-expected.amounts';

vi.mock('./sales-kpi-event-refresh', () => ({
  refreshSalesKpiAfterClientPayment: vi.fn().mockResolvedValue(undefined),
}));

const INVOICE_ID = 'inv-210';
const PAYMENT_DATE = '2026-09-15';
const FUTURE_DUE = new Date('2099-12-31T00:00:00.000Z');

describe('P6-S2 PaymentsService.create gates onInvoicePaid until re-read PAID', () => {
  let prisma: MockPrisma;
  let invoice: StoredInvoice;
  let service: PaymentsService;
  const salesBonusAccrual = { onInvoicePaid: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    prisma = createMockPrisma();
    invoice = createStoredInvoice();
    bindInvoiceStore(prisma, invoice);
    salesBonusAccrual.onInvoicePaid.mockReset();
    salesBonusAccrual.onInvoicePaid.mockImplementation(async () => {
      expect(invoice.moneyStatus).toBe('PAID');
    });
    service = createPaymentsService(prisma, salesBonusAccrual);
  });

  it('skips onInvoicePaid on 100000 then 100000 and calls once after the final 10000', async () => {
    await recordReceipt(service, P6_S2_INVOICE_RECEIPT_1.toNumber());
    expectStatusFromStoredPayments(invoice).not.toBe('PAID');
    expect(salesBonusAccrual.onInvoicePaid).not.toHaveBeenCalled();

    await recordReceipt(service, P6_S2_INVOICE_RECEIPT_2.toNumber());
    expectStatusFromStoredPayments(invoice).not.toBe('PAID');
    expect(salesBonusAccrual.onInvoicePaid).not.toHaveBeenCalled();

    await recordReceipt(service, P6_S2_INVOICE_RECEIPT_3.toNumber());
    expectStatusFromStoredPayments(invoice).toBe('PAID');
    expect(salesBonusAccrual.onInvoicePaid).toHaveBeenCalledTimes(1);
    expect(salesBonusAccrual.onInvoicePaid).toHaveBeenCalledWith(INVOICE_ID);
  });
});

type StoredPayment = {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string | null;
  confirmedBy: string | null;
  notes: string | null;
};

type StoredInvoice = {
  id: string;
  code: string;
  orderId: null;
  projectId: string;
  companyId: string;
  amount: number;
  moneyStatus: InvoiceMoneyStatusEnum;
  taxStatus: null;
  officialInvoiceRequestSent: boolean;
  type: string;
  notes: null;
  orderComment: null;
  dueDate: Date;
  paidDate: Date | null;
  company: { name: string; legalName: null; taxId: null };
  order: null;
  payments: StoredPayment[];
};

type PaymentCreateData = {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string | null;
  confirmedBy?: string | null;
  notes?: string | null;
};

type InvoiceUpdateData = {
  moneyStatus?: InvoiceMoneyStatusEnum;
  paidDate?: Date | null;
};

function createStoredInvoice(): StoredInvoice {
  return {
    id: INVOICE_ID,
    code: 'INV-210',
    orderId: null,
    projectId: 'proj-210',
    companyId: 'company-210',
    amount: P6_S2_INVOICE_AMOUNT.toNumber(),
    moneyStatus: 'NEW',
    taxStatus: null,
    officialInvoiceRequestSent: false,
    type: 'DEVELOPMENT',
    notes: null,
    orderComment: null,
    dueDate: FUTURE_DUE,
    paidDate: null,
    company: { name: 'P6 S2 Co', legalName: null, taxId: null },
    order: null,
    payments: [],
  };
}

function bindInvoiceStore(prisma: MockPrisma, invoice: StoredInvoice): void {
  prisma.invoice.findUnique.mockImplementation(async ({ where }) =>
    where.id === invoice.id ? invoiceLookup(invoice) : null,
  );
  prisma.invoice.update.mockImplementation(async ({ where, data }) => {
    if (where.id !== invoice.id) return { id: where.id, ...data };
    applyInvoiceUpdate(invoice, data);
    return { id: invoice.id, moneyStatus: invoice.moneyStatus, paidDate: invoice.paidDate };
  });
  prisma.payment.create.mockImplementation(async ({ data }) => {
    const created = nextPayment(invoice, data);
    invoice.payments.push(created);
    return created;
  });
  prisma.payment.findUnique.mockImplementation(async ({ where }) =>
    paymentLookup(invoice, where.id),
  );
}

function invoiceLookup(invoice: StoredInvoice) {
  return {
    ...invoice,
    payments: invoice.payments.map((payment) => ({
      amount: payment.amount,
      paymentDate: payment.paymentDate,
    })),
  };
}

function applyInvoiceUpdate(invoice: StoredInvoice, data: InvoiceUpdateData): void {
  if (data.moneyStatus !== undefined) {
    invoice.moneyStatus = data.moneyStatus;
  }
  if ('paidDate' in data) {
    invoice.paidDate = data.paidDate ?? null;
  }
}

function nextPayment(invoice: StoredInvoice, data: PaymentCreateData): StoredPayment {
  return {
    id: `pay-${invoice.payments.length + 1}`,
    invoiceId: data.invoiceId,
    amount: data.amount,
    paymentDate: data.paymentDate,
    paymentMethod: data.paymentMethod ?? null,
    confirmedBy: data.confirmedBy ?? null,
    notes: data.notes ?? null,
  };
}

function paymentLookup(invoice: StoredInvoice, id: string) {
  const payment = invoice.payments.find((row) => row.id === id);
  if (!payment) return null;
  return {
    ...payment,
    invoice: {
      id: invoice.id,
      code: invoice.code,
      projectId: invoice.projectId,
      amount: invoice.amount,
      moneyStatus: invoice.moneyStatus,
      company: { id: invoice.companyId, name: invoice.company.name },
      order: null,
      subscription: null,
    },
    confirmer: null,
  };
}

function createPaymentsService(
  prisma: MockPrisma,
  salesBonusAccrual: { onInvoicePaid: ReturnType<typeof vi.fn> },
): PaymentsService {
  const operationalJournal = {
    appendCashPaymentLine: vi.fn().mockResolvedValue(undefined),
    reverseJournalLineByIdempotencyKey: vi.fn().mockResolvedValue(undefined),
  };
  const partnerAccrualClassic = {
    tryInboundClassicAfterClientPayment: vi.fn().mockResolvedValue(undefined),
  };
  const partnerAccrualSubscription = {
    tryInboundSubscriptionAfterClientPayment: vi.fn().mockResolvedValue(undefined),
  };
  const clientPaidInvoiceAutomation = {
    onInvoiceFullyPaid: vi.fn().mockResolvedValue({ taskId: null, expenseId: null }),
  };
  const notifications = { create: vi.fn() } as unknown as NotificationService;
  return new PaymentsService(
    prisma as never,
    salesBonusAccrual as never,
    notifications,
    operationalJournal as never,
    partnerAccrualClassic as never,
    partnerAccrualSubscription as never,
    clientPaidInvoiceAutomation as never,
  );
}

async function recordReceipt(service: PaymentsService, amount: number): Promise<void> {
  await service.create({
    invoiceId: INVOICE_ID,
    amount,
    paymentDate: PAYMENT_DATE,
  });
}

function expectStatusFromStoredPayments(invoice: StoredInvoice) {
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const derived = syncInvoiceMoneyStatusFromPayments({
    currentMoneyStatus: 'NEW',
    amount: invoice.amount,
    paid,
    dueDate: invoice.dueDate,
    now: new Date(),
  });
  expect(invoice.moneyStatus).toBe(derived);
  return expect(invoice.moneyStatus);
}
