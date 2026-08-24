import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { prepareInvoiceMoneyStatusTransition } from './invoice-money-status-transition';

const readyTaxInvoice = {
  id: 'inv-1',
  taxStatus: 'TAX' as const,
  moneyStatus: 'AWAITING_PAYMENT' as const,
  companyId: 'c1',
  officialInvoiceRequestSent: true,
  company: { name: 'InvestOn LLC', legalName: 'InvestOn LLC', taxId: '01234567' },
};

describe('prepareInvoiceMoneyStatusTransition', () => {
  it('blocks Tax Paid when official request is not sent', async () => {
    await expect(
      prepareInvoiceMoneyStatusTransition(
        { invoice: { findUnique: vi.fn(), update: vi.fn() } } as never,
        { ...readyTaxInvoice, officialInvoiceRequestSent: false },
        'PAID',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels the official request when a Tax card is cancelled', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          ...readyTaxInvoice,
          officialInvoiceSentAt: new Date(),
          officialInvoiceCancelledAt: null,
          govInvoiceId: null,
        }),
        update: vi.fn().mockResolvedValue({ officialInvoiceRequestSent: false }),
      },
    };

    await prepareInvoiceMoneyStatusTransition(prisma as never, readyTaxInvoice, 'CANCELLED');

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ officialInvoiceRequestSent: false }),
      }),
    );
  });
});
