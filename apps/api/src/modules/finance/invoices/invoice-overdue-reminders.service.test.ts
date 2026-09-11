import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { InvoiceOverdueRemindersService } from './invoice-overdue-reminders.service';
import { OVERDUE_REMINDER_EVENT_TYPES } from './invoice-overdue-reminder.constants';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';
import { deliverFinanceClientReminder } from '../../messenger/core/messenger-finance-reminder.ops';

vi.mock('./invoice-product-whatsapp-resolve', () => ({
  resolveInvoiceProductWhatsAppGroup: vi.fn(async () => ({
    productId: 'prod-1',
    groupChatId: 'group-1@g.us',
    conversationId: 'conv-1',
  })),
}));

vi.mock('../../messenger/core/messenger-finance-reminder.ops', () => ({
  deliverFinanceClientReminder: vi.fn(async () => ({
    conversationId: 'conv-1',
    messageId: 'msg-1',
    groupChatId: 'group-1@g.us',
  })),
}));

const resolveWhatsApp = vi.mocked(resolveInvoiceProductWhatsAppGroup);
const deliverReminder = vi.mocked(deliverFinanceClientReminder);

describe('InvoiceOverdueRemindersService', () => {
  let prisma: MockPrisma;
  let outbound: { enqueue: ReturnType<typeof vi.fn> };
  let service: InvoiceOverdueRemindersService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.notificationJob.findUnique.mockResolvedValue(null);
    prisma.notificationJob.findMany.mockResolvedValue([]);
    prisma.notificationRule.upsert.mockResolvedValue({ id: 'rule-1' });
    prisma.notificationEvent.upsert.mockResolvedValue({ id: 'event-1' });
    prisma.notificationJob.create.mockResolvedValue({ id: 'job-1' });
    outbound = { enqueue: vi.fn().mockResolvedValue(undefined) };
    resolveWhatsApp.mockReset().mockResolvedValue({
      productId: 'prod-1',
      groupChatId: 'group-1@g.us',
      conversationId: 'conv-1',
    });
    deliverReminder.mockReset().mockResolvedValue({
      conversationId: 'conv-1',
      messageId: 'msg-1',
      groupChatId: 'group-1@g.us',
    });
    service = new InvoiceOverdueRemindersService(prisma as never, outbound as never);
  });

  it('sends wave 1 to new overdue and wave 2 to invoice that already had wave 1 two days ago', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      overdueCandidate({ id: 'inv-new', code: 'INV-NEW' }),
      overdueCandidate({ id: 'inv-old', code: 'INV-OLD' }),
    ]);
    prisma.notificationJob.findMany.mockResolvedValue([
      {
        dedupeKey: 'invoice_overdue_reminder:w1:inv-old',
        scheduledFor: new Date('2026-08-06T11:00:00+04:00'),
      },
    ]);

    const result = await service.run({ asOf: new Date('2026-08-08T12:00:00+04:00') });

    expect(result.wave1Count).toBe(1);
    expect(result.wave2Count).toBe(1);
    expect(result.sent).toEqual([
      { invoiceId: 'inv-new', code: 'INV-NEW', wave: 1 },
      { invoiceId: 'inv-old', code: 'INV-OLD', wave: 2 },
    ]);
    expect(prisma.notificationJob.create).toHaveBeenCalledTimes(2);
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventType: OVERDUE_REMINDER_EVENT_TYPES.W1,
          payload: expect.objectContaining({
            wave: 1,
            messageText: expect.stringContaining('ժամկետը լրացել է'),
          }),
        }),
      }),
    );
    expect(deliverReminder).toHaveBeenCalledWith(
      prisma,
      outbound,
      expect.objectContaining({ productId: 'prod-1' }),
    );
  });

  it('does not send wave 2 on the same Yerevan day as wave 1', async () => {
    prisma.invoice.findMany.mockResolvedValue([overdueCandidate({ id: 'inv-1', code: 'INV-1' })]);
    prisma.notificationJob.findMany.mockResolvedValue([
      {
        dedupeKey: 'invoice_overdue_reminder:w1:inv-1',
        scheduledFor: new Date('2026-08-08T09:00:00+04:00'),
      },
    ]);

    const result = await service.run({ asOf: new Date('2026-08-08T15:00:00+04:00') });

    expect(result.sent).toEqual([]);
    expect(result.skipped).toEqual([{ invoiceId: 'inv-1', code: 'INV-1', reason: 'same_day' }]);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('skips paid-style gates without failing the batch', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      overdueCandidate({ id: 'inv-off', notificationsEnabled: false }),
      overdueCandidate({
        id: 'inv-tax',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      }),
      overdueCandidate({
        id: 'inv-sub-off',
        subscription: {
          name: 'Acme Site',
          code: 'SUB-1',
          productId: 'prod-1',
          notificationsEnabled: false,
          reminderLanguage: 'HY',
          product: { id: 'prod-1', name: 'Acme Site' },
        },
      }),
    ]);
    resolveWhatsApp.mockImplementation(async (_prisma, invoiceId) => {
      if (invoiceId === 'inv-nowa') return null;
      return { productId: 'prod-1', groupChatId: 'group-1@g.us', conversationId: 'conv-1' };
    });

    const preview = await service.preview({ asOf: new Date('2026-08-08T12:00:00+04:00') });

    expect(preview.sendable).toEqual([]);
    expect(preview.skipped.map((row) => row.reason)).toEqual([
      'notifications_off',
      'tax_gate',
      'notifications_off',
    ]);
  });

  it('skips when Product WhatsApp group is missing', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      overdueCandidate({ id: 'inv-nowa', code: 'INV-NO' }),
    ]);
    resolveWhatsApp.mockResolvedValue(null);

    const result = await service.run({ asOf: new Date('2026-08-08T12:00:00+04:00') });

    expect(result.skipped).toEqual([
      { invoiceId: 'inv-nowa', code: 'INV-NO', reason: 'no_whatsapp' },
    ]);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('does not include deal-only invoices in the candidate query', async () => {
    prisma.invoice.findMany.mockResolvedValue([]);

    await service.preview({ asOf: new Date('2026-08-08T12:00:00+04:00') });

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          moneyStatus: 'OVERDUE',
          OR: [{ subscriptionId: { not: null } }, { clientServiceRecordId: { not: null } }],
        },
      }),
    );
  });

  it('does not create a second job when Core already persisted the wave', async () => {
    prisma.invoice.findMany.mockResolvedValue([overdueCandidate({ id: 'inv-1', code: 'INV-1' })]);
    prisma.notificationJob.findUnique.mockResolvedValue({ id: 'job-existing' });
    prisma.messengerMessage.findFirst.mockResolvedValue({ id: 'msg-existing' });

    const result = await service.run({ asOf: new Date('2026-08-08T12:00:00+04:00') });

    expect(result.sent).toEqual([]);
    expect(result.skipped).toEqual([{ invoiceId: 'inv-1', code: 'INV-1', reason: 'already_sent' }]);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
    expect(deliverReminder).not.toHaveBeenCalled();
  });

  it('retries Core persist when a NotificationJob exists without a Core message', async () => {
    prisma.invoice.findMany.mockResolvedValue([overdueCandidate({ id: 'inv-1', code: 'INV-1' })]);
    prisma.notificationJob.findUnique.mockResolvedValue({ id: 'job-existing' });
    prisma.messengerMessage.findFirst.mockResolvedValue(null);
    deliverReminder.mockRejectedValueOnce(new Error('persist failed'));

    const first = await service.run({ asOf: new Date('2026-08-08T12:00:00+04:00') });
    expect(first.sent).toEqual([]);
    expect(first.skipped).toEqual([{ invoiceId: 'inv-1', code: 'INV-1', reason: 'send_failed' }]);
    expect(first.skipped[0]?.reason).not.toBe('already_sent');

    deliverReminder.mockResolvedValueOnce({
      conversationId: 'conv-1',
      messageId: 'msg-retry',
      groupChatId: 'group-1@g.us',
    });
    const second = await service.run({ asOf: new Date('2026-08-08T12:00:00+04:00') });
    expect(deliverReminder).toHaveBeenCalledTimes(2);
    expect(second.sent).toEqual([{ invoiceId: 'inv-1', code: 'INV-1', wave: 1 }]);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });

  it('sends client-service wave 1 with RU copy', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        ...overdueCandidate({ id: 'inv-cs', code: 'INV-CS', taxStatus: 'TAX' }),
        subscription: null,
        officialInvoiceRequestSent: true,
        clientServiceRecord: {
          notificationsEnabled: true,
          reminderLanguage: 'RU',
          productId: 'prod-1',
          name: 'example.com',
          type: 'DOMAIN',
          registryLookupStatus: 'OBSERVED',
          product: { id: 'prod-1', name: 'Example' },
        },
      },
    ]);

    const result = await service.run({ asOf: new Date('2026-08-08T12:00:00+04:00') });

    expect(result.sent).toEqual([{ invoiceId: 'inv-cs', code: 'INV-CS', wave: 1 }]);
    expect(prisma.notificationEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          payload: expect.objectContaining({
            language: 'RU',
            messageText: expect.stringContaining('Срок оплаты прошёл'),
          }),
        }),
      }),
    );
  });
});

function overdueCandidate(
  overrides: Partial<ReturnType<typeof baseOverdue>> & {
    subscription?: ReturnType<typeof baseOverdue>['subscription'] | null;
  } = {},
) {
  return { ...baseOverdue(), ...overrides };
}

function baseOverdue() {
  return {
    id: 'inv-od',
    code: 'INV-OD',
    amount: 120000,
    dueDate: new Date('2026-08-05T00:00:00+04:00'),
    coverageStartMonth: '2026-07',
    coverageMonthCount: 1,
    taxStatus: 'TAX_FREE',
    moneyStatus: 'OVERDUE',
    officialInvoiceRequestSent: false,
    notificationsEnabled: true,
    paymentReminderCycle: 0,
    company: { name: 'ACME' },
    clientServiceRecord: null,
    subscription: {
      name: 'Acme Site',
      code: 'SUB-1',
      productId: 'prod-1',
      notificationsEnabled: true,
      reminderLanguage: 'HY' as const,
      product: { id: 'prod-1', name: 'Acme Site' },
    },
  };
}
