import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import {
  INVOICE_CARD_REMINDER_TYPES,
  InvoiceCardRemindersService,
} from './invoice-card-reminders.service';
import { SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES } from './subscription-payment-reminder.constants';

vi.mock('./invoice-product-whatsapp-resolve', () => ({
  resolveInvoiceProductWhatsAppGroup: vi.fn(async () => ({
    productId: 'prod-1',
    groupChatId: 'group-1@g.us',
  })),
}));

describe('InvoiceCardRemindersService', () => {
  let prisma: MockPrisma;
  let service: InvoiceCardRemindersService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.notificationJob.findUnique.mockResolvedValue(null);
    prisma.notificationRule.upsert.mockResolvedValue({ id: 'rule-1' });
    prisma.notificationEvent.upsert.mockResolvedValue({ id: 'event-1' });
    prisma.notificationJob.create.mockResolvedValue({ id: 'job-1' });
    prisma.notificationDelivery.create.mockResolvedValue({ id: 'del-1' });
    service = new InvoiceCardRemindersService(prisma as never);
  });

  it('creates an official request job for due Tax invoices without request sent', async () => {
    prisma.invoice.findMany
      .mockResolvedValueOnce([
        officialCandidate({
          id: 'inv-1',
          taxStatus: 'TAX',
          officialInvoiceRequestSent: false,
        }),
      ])
      .mockResolvedValueOnce([]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-05T12:00:00+04:00'),
    });

    expect(result.created).toEqual([
      { created: true, type: INVOICE_CARD_REMINDER_TYPES.OFFICIAL_REQUEST_DUE, invoiceId: 'inv-1' },
    ]);
    expect(prisma.notificationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
          dedupeKey: expect.stringContaining('finance.invoice.official_request_due:inv-1'),
        }),
      }),
    );
  });

  it('does not create client payment reminder when Tax official request blocks', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        id: 'inv-tax',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-05T12:00:00+04:00'),
    });

    expect(result.created).toEqual([]);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('creates D-10 payment reminder on exact Yerevan offset day', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        id: 'inv-d10',
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
        coverageStartMonth: '2026-04',
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-05T12:00:00+04:00'),
    });

    expect(result.created).toEqual([
      {
        created: true,
        type: SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.D10,
        invoiceId: 'inv-d10',
      },
    ]);
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          payload: expect.objectContaining({
            offsetDays: 10,
            language: 'HY',
            productName: 'Acme Site',
            messageText: expect.stringContaining('Հարկավոր է'),
          }),
        }),
      }),
    );
  });

  it('creates D-2 payment reminder on exact offset day with softer copy', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        id: 'inv-d2',
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
        coverageStartMonth: '2026-04',
        reminderLanguage: 'EN',
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-13T12:00:00+04:00'),
    });

    expect(result.created).toEqual([
      {
        created: true,
        type: SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.D2,
        invoiceId: 'inv-d2',
      },
    ]);
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          payload: expect.objectContaining({
            offsetDays: 2,
            language: 'EN',
            messageText: expect.stringContaining('Kindly make the monthly subscription payment'),
          }),
        }),
      }),
    );
  });

  it('creates D-2 payment reminder for client service invoice', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      clientServicePaymentCandidate({
        id: 'inv-cs',
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
        reminderLanguage: 'RU',
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-13T12:00:00+04:00'),
    });

    expect(result.created).toEqual([
      {
        created: true,
        type: SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.D2,
        invoiceId: 'inv-cs',
      },
    ]);
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          payload: expect.objectContaining({
            offsetDays: 2,
            language: 'RU',
            productName: 'example.com',
            messageText: expect.stringContaining('Просим оплатить'),
          }),
        }),
      }),
    );
  });

  it('does not catch up D-10 after its day has passed', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        id: 'inv-late',
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-06T12:00:00+04:00'),
    });

    expect(result.created).toEqual([]);
  });

  it('skips already scheduled payment reminder by invoice+offset dedupe', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        id: 'inv-3',
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
      }),
    ]);
    prisma.notificationJob.findUnique.mockResolvedValue({ id: 'job-1' });

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-05T12:00:00+04:00'),
    });

    expect(result.skippedExisting).toBe(1);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('skips when notificationsEnabled is false on invoice', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        id: 'inv-off',
        notificationsEnabled: false,
        dueDate: new Date('2026-05-15T00:00:00+04:00'),
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-05T12:00:00+04:00'),
    });

    expect(result.created).toEqual([]);
  });
});

function officialCandidate(overrides: Partial<ReturnType<typeof baseOfficial>>) {
  return { ...baseOfficial(), ...overrides };
}

function paymentCandidate(
  overrides: Partial<ReturnType<typeof basePayment>> & {
    reminderLanguage?: string;
  } = {},
) {
  const { reminderLanguage, ...rest } = overrides;
  const base = basePayment();
  return {
    ...base,
    ...rest,
    subscription: {
      ...base.subscription,
      ...(reminderLanguage ? { reminderLanguage } : {}),
    },
  };
}

function clientServicePaymentCandidate(
  overrides: Partial<ReturnType<typeof baseClientServicePayment>> & {
    reminderLanguage?: string;
  } = {},
) {
  const { reminderLanguage, ...rest } = overrides;
  const base = baseClientServicePayment();
  return {
    ...base,
    ...rest,
    clientServiceRecord: {
      ...base.clientServiceRecord,
      ...(reminderLanguage ? { reminderLanguage } : {}),
    },
    subscription: null,
  };
}

function baseOfficial() {
  return {
    id: 'inv-1',
    code: 'INV-1',
    amount: 120000,
    dueDate: new Date('2026-05-01T00:00:00+04:00'),
    taxStatus: 'TAX',
    moneyStatus: 'AWAITING_PAYMENT',
    officialInvoiceRequestSent: false,
    notificationsEnabled: true,
    company: { name: 'ACME' },
    clientServiceRecord: { notificationsEnabled: true },
  };
}

function basePayment() {
  return {
    id: 'inv-pay',
    code: 'INV-PAY',
    amount: 120000,
    dueDate: new Date('2026-05-15T00:00:00+04:00'),
    coverageStartMonth: '2026-04',
    taxStatus: 'TAX_FREE',
    moneyStatus: 'AWAITING_PAYMENT',
    officialInvoiceRequestSent: false,
    notificationsEnabled: true,
    company: { name: 'ACME' },
    clientServiceRecord: null,
    subscription: {
      productId: 'prod-1',
      notificationsEnabled: true,
      reminderLanguage: 'HY' as const,
      product: { id: 'prod-1', name: 'Acme Site' },
    },
  };
}

function baseClientServicePayment() {
  return {
    id: 'inv-cs-pay',
    code: 'INV-CS',
    amount: 45000,
    dueDate: new Date('2026-05-15T00:00:00+04:00'),
    coverageStartMonth: null,
    taxStatus: 'TAX',
    moneyStatus: 'AWAITING_PAYMENT',
    officialInvoiceRequestSent: true,
    notificationsEnabled: true,
    company: { name: 'ACME' },
    subscription: null,
    clientServiceRecord: {
      notificationsEnabled: true,
      reminderLanguage: 'RU' as const,
      productId: 'prod-1',
      name: 'example.com',
      product: { id: 'prod-1', name: 'Example Product' },
    },
  };
}
