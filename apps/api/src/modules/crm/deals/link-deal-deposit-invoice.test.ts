import { describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { linkDealDepositInvoiceToSubscription } from './link-deal-deposit-invoice';

const PAID_AT = new Date(2026, 2, 15);

function mockLogger() {
  return { warn: vi.fn() };
}

function linkableRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-deposit',
    code: 'INV-2026-0001',
    amount: new Decimal('1000000.00'),
    paidDate: PAID_AT,
    subscriptionId: null,
    type: 'SUBSCRIPTION',
    order: { dealId: 'deal-1' },
    ...overrides,
  };
}

function linkInput(
  prisma: MockPrisma,
  logger: ReturnType<typeof mockLogger>,
  overrides: Partial<Parameters<typeof linkDealDepositInvoiceToSubscription>[0]> = {},
) {
  return {
    prisma,
    logger,
    dealId: 'deal-1',
    dealCode: 'D-2026-0001',
    invoiceId: 'inv-deposit',
    subscriptionId: 'sub-1',
    periodAmount: new Decimal('1000000.00'),
    periodCoverageMonthCount: 1,
    ...overrides,
  };
}

describe('linkDealDepositInvoiceToSubscription', () => {
  it('links a one-period deposit with the paid month as coverage start', async () => {
    const prisma = createMockPrisma();
    const logger = mockLogger();
    prisma.invoice.findUnique.mockResolvedValue(linkableRow());

    await linkDealDepositInvoiceToSubscription(linkInput(prisma, logger));

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-deposit' },
      data: {
        subscriptionId: 'sub-1',
        coverageStartMonth: '2026-03',
        coverageMonthCount: 1,
      },
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('links an exact two-period deposit as two coverage months', async () => {
    const prisma = createMockPrisma();
    const logger = mockLogger();
    prisma.invoice.findUnique.mockResolvedValue(linkableRow({ amount: new Decimal('2000000.00') }));

    await linkDealDepositInvoiceToSubscription(linkInput(prisma, logger));

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-deposit' },
      data: {
        subscriptionId: 'sub-1',
        coverageStartMonth: '2026-03',
        coverageMonthCount: 2,
      },
    });
  });

  it('leaves a partial deposit unlinked, writes nothing else, and warns', async () => {
    const prisma = createMockPrisma();
    const logger = mockLogger();
    prisma.invoice.findUnique.mockResolvedValue(linkableRow({ amount: new Decimal('400000.00') }));

    await linkDealDepositInvoiceToSubscription(linkInput(prisma, logger));

    expect(prisma.invoice.update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const warning = String(logger.warn.mock.calls[0]?.[0]);
    expect(warning).toContain('D-2026-0001');
    expect(warning).toContain('INV-2026-0001');
    expect(warning).toContain('400000.00');
    expect(warning).toContain('1000000.00');
  });

  it('never re-links an invoice that already has a subscriptionId', async () => {
    const prisma = createMockPrisma();
    const logger = mockLogger();
    prisma.invoice.findUnique.mockResolvedValue(linkableRow({ subscriptionId: 'sub-other' }));

    await linkDealDepositInvoiceToSubscription(linkInput(prisma, logger));

    expect(prisma.invoice.update).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('does not look up or write when the invoice id is missing', async () => {
    const prisma = createMockPrisma();
    const logger = mockLogger();

    await linkDealDepositInvoiceToSubscription(linkInput(prisma, logger, { invoiceId: undefined }));

    expect(prisma.invoice.findUnique).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('does not move an invoice that belongs to another deal', async () => {
    const prisma = createMockPrisma();
    const logger = mockLogger();
    prisma.invoice.findUnique.mockResolvedValue(linkableRow({ order: { dealId: 'deal-other' } }));

    await linkDealDepositInvoiceToSubscription(linkInput(prisma, logger));

    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });
});
