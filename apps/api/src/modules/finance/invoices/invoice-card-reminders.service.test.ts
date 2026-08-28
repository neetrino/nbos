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
    expect(prisma.invoice.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.notificationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
          dedupeKey: expect.stringContaining('finance.invoice.official_request_due:inv-1'),
        }),
      }),
    );
  });

  it('does not create pre-due client WhatsApp (retired D-10 / D-2)', async () => {
    prisma.invoice.findMany.mockResolvedValueOnce([]);

    const result = await service.runDueInvoiceCardReminders({
      asOf: new Date('2026-05-13T12:00:00+04:00'),
    });

    expect(result.created).toEqual([]);
    expect(result.skippedNoWhatsApp).toBe(0);
    expect(prisma.invoice.findMany).toHaveBeenCalledTimes(1);
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
