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
    service = new InvoiceCardRemindersService(prisma as never);
  });

  it('creates an official request job for due Tax invoices without request sent', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      invoiceCandidate({
        id: 'inv-1',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({ asOf: new Date('2026-05-05') });

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

  it('creates a payment reminder job only after Tax official request was sent', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      invoiceCandidate({
        id: 'inv-2',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: true,
      }),
    ]);

    const result = await service.runDueInvoiceCardReminders({ asOf: new Date('2026-05-05') });

    expect(result.created).toEqual([
      { created: true, type: INVOICE_CARD_REMINDER_TYPES.PAYMENT_REMINDER_DUE, invoiceId: 'inv-2' },
    ]);
  });

  it('skips already scheduled reminder jobs by dedupe key', async () => {
    prisma.invoice.findMany.mockResolvedValue([invoiceCandidate({ id: 'inv-3' })]);
    prisma.notificationJob.findUnique.mockResolvedValue({ id: 'job-1' });

    const result = await service.runDueInvoiceCardReminders({ asOf: new Date('2026-05-05') });

    expect(result.skippedExisting).toBe(1);
    expect(prisma.notificationJob.create).not.toHaveBeenCalled();
  });
});

interface TestInvoiceCandidate {
  id: string;
  code: string;
  amount: number;
  dueDate: Date;
  taxStatus: string;
  moneyStatus: string;
  officialInvoiceRequestSent: boolean;
  notificationsEnabled: boolean;
  company: { name: string };
  clientServiceRecord: { notificationsEnabled: boolean };
}

function invoiceCandidate(overrides: Partial<TestInvoiceCandidate>) {
  return { ...baseInvoiceCandidate(), ...overrides };
}

function baseInvoiceCandidate(): TestInvoiceCandidate {
  return {
    id: 'inv-1',
    code: 'INV-1',
    amount: 120000,
    dueDate: new Date('2026-05-01'),
    taxStatus: 'TAX_FREE',
    moneyStatus: 'AWAITING_PAYMENT',
    officialInvoiceRequestSent: false,
    notificationsEnabled: true,
    company: { name: 'ACME' },
    clientServiceRecord: { notificationsEnabled: true },
  };
}
