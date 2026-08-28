import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import {
  INVOICE_CARD_REMINDER_TYPES,
  InvoiceCardRemindersService,
} from './invoice-card-reminders.service';

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
    prisma.invoice.findMany.mockResolvedValueOnce([
      officialCandidate({
        id: 'inv-1',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-05T12:00:00+04:00'),
    });

    expect(result.created).toEqual([
      { created: true, type: INVOICE_CARD_REMINDER_TYPES.OFFICIAL_REQUEST_DUE, invoiceId: 'inv-1' },
    ]);
    expect(prisma.invoice.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.notificationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
          dedupeKey: expect.stringContaining('finance.invoice.official_request_due:inv-1'),
        }),
      }),
    );
  });

  it('sends the 5-day letter on the pay day, not on the 1st when pay day is the 15th', async () => {
    const card = paymentCandidate({
      billingDay: 15,
      createdAt: new Date('2026-04-01T11:00:00+04:00'),
      dueDate: new Date('2026-04-20T00:00:00+04:00'),
    });
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([card]);
    stubProductWhatsApp(prisma);

    const tooEarly = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-04-01T11:00:00+04:00'),
    });
    expect(tooEarly.created).toEqual([]);

    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([card]);
    const onPayDay = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-04-15T11:00:00+04:00'),
    });
    expect(onPayDay.created).toEqual([
      {
        created: true,
        type: INVOICE_CARD_REMINDER_TYPES.PAYMENT_WINDOW,
        invoiceId: 'inv-pay',
      },
    ]);
  });

  it('does not send the 5-day letter before the 1st for an early day-1 card', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        billingDay: 1,
        createdAt: new Date('2026-03-30T11:00:00+04:00'),
        dueDate: new Date('2026-04-06T00:00:00+04:00'),
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-03-30T11:00:00+04:00'),
    });

    expect(result.created).toEqual([]);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('sends on the late issue day when we created the card after pay day', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        billingDay: 10,
        createdAt: new Date('2026-04-14T11:00:00+04:00'),
        dueDate: new Date('2026-04-19T00:00:00+04:00'),
      }),
    ]);
    stubProductWhatsApp(prisma);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-04-14T11:00:00+04:00'),
    });

    expect(result.created).toEqual([
      {
        created: true,
        type: INVOICE_CARD_REMINDER_TYPES.PAYMENT_WINDOW,
        invoiceId: 'inv-pay',
      },
    ]);
  });

  it('sends Tax cards on pay day even if official request is not sent yet', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
        billingDay: 10,
        createdAt: new Date('2026-04-10T11:00:00+04:00'),
        dueDate: new Date('2026-04-15T00:00:00+04:00'),
      }),
    ]);
    stubProductWhatsApp(prisma);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-04-10T11:00:00+04:00'),
    });

    expect(result.created).toEqual([
      {
        created: true,
        type: INVOICE_CARD_REMINDER_TYPES.PAYMENT_WINDOW,
        invoiceId: 'inv-pay',
      },
    ]);
  });

  it('does not create a second window letter when the job already exists', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      paymentCandidate({
        billingDay: 10,
        createdAt: new Date('2026-04-10T11:00:00+04:00'),
        dueDate: new Date('2026-04-15T00:00:00+04:00'),
      }),
    ]);
    prisma.notificationJob.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-04-10T11:00:00+04:00'),
    });

    expect(result.created).toEqual([]);
    expect(result.skippedExisting).toBe(1);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });
});

function officialCandidate(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

function paymentCandidate(
  overrides: Record<string, unknown> & { billingDay?: number; createdAt?: Date } = {},
) {
  const { billingDay = 15, createdAt, ...rest } = overrides;
  return {
    id: 'inv-pay',
    code: 'INV-PAY',
    amount: 180000,
    createdAt: createdAt ?? new Date('2026-04-01T11:00:00+04:00'),
    dueDate: new Date('2026-04-20T00:00:00+04:00'),
    coverageStartMonth: '2026-04',
    taxStatus: 'TAX_FREE',
    moneyStatus: 'AWAITING_PAYMENT',
    officialInvoiceRequestSent: false,
    notificationsEnabled: true,
    paymentReminderCycle: 0,
    company: { name: 'ACME' },
    clientServiceRecord: null,
    subscription: {
      productId: 'prod-1',
      billingDay,
      notificationsEnabled: true,
      reminderLanguage: 'RU',
      product: { id: 'prod-1', name: 'Site A' },
    },
    ...rest,
  };
}

function stubProductWhatsApp(prisma: MockPrisma): void {
  prisma.invoice.findUnique.mockResolvedValue({
    subscription: { productId: 'prod-1' },
    clientServiceRecord: null,
    order: null,
  });
  prisma.productWhatsAppGroupBinding.findUnique.mockResolvedValue({
    groupChatId: '120@g.us',
    status: 'ACTIVE',
  });
}
