import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  cancelOfficialInvoiceRequest,
  isOfficialRequestBlockingTaxReminders,
  sendOfficialInvoiceRequest,
  updateOfficialInvoiceGovId,
} from './invoice-official-request';

function officialRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    taxStatus: 'TAX',
    companyId: 'c1',
    officialInvoiceRequestSent: false,
    officialInvoiceSentAt: null,
    officialInvoiceCancelledAt: null,
    govInvoiceId: null,
    company: { name: 'InvestOn LLC', taxId: '01234567' },
    ...overrides,
  };
}

describe('isOfficialRequestBlockingTaxReminders', () => {
  it('blocks when Tax and request not sent', () => {
    expect(
      isOfficialRequestBlockingTaxReminders({
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      }),
    ).toBe(true);
  });

  it('does not block when request sent or tax-free', () => {
    expect(
      isOfficialRequestBlockingTaxReminders({
        taxStatus: 'TAX',
        officialInvoiceRequestSent: true,
      }),
    ).toBe(false);
    expect(
      isOfficialRequestBlockingTaxReminders({
        taxStatus: 'FREE',
        officialInvoiceRequestSent: false,
      }),
    ).toBe(false);
  });
});

describe('sendOfficialInvoiceRequest', () => {
  it('rejects tax-free invoices', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(officialRow({ taxStatus: 'FREE' })),
        update: vi.fn(),
      },
    };
    await expect(sendOfficialInvoiceRequest(prisma as never, 'inv-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('marks request sent and clears cancel timestamp', async () => {
    const prisma = {
      invoice: {
        findUnique: vi
          .fn()
          .mockResolvedValue(officialRow({ officialInvoiceCancelledAt: new Date('2026-01-01') })),
        update: vi.fn().mockResolvedValue(
          officialRow({
            officialInvoiceRequestSent: true,
            officialInvoiceSentAt: new Date('2026-05-20'),
            officialInvoiceCancelledAt: null,
          }),
        ),
      },
    };
    const result = await sendOfficialInvoiceRequest(prisma as never, 'inv-1');
    expect(result.officialInvoiceRequestSent).toBe(true);
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          officialInvoiceRequestSent: true,
          officialInvoiceCancelledAt: null,
        }),
      }),
    );
  });

  it('rejects Tax invoices without company tax id', async () => {
    const prisma = {
      invoice: {
        findUnique: vi
          .fn()
          .mockResolvedValue(officialRow({ company: { name: 'InvestOn LLC', taxId: null } })),
        update: vi.fn(),
      },
    };
    await expect(sendOfficialInvoiceRequest(prisma as never, 'inv-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });
});

describe('cancelOfficialInvoiceRequest', () => {
  it('rejects when no active request', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(officialRow()),
        update: vi.fn(),
      },
    };
    await expect(cancelOfficialInvoiceRequest(prisma as never, 'inv-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('updateOfficialInvoiceGovId', () => {
  it('trims and stores gov id', async () => {
    const prisma = {
      invoice: {
        findUnique: vi
          .fn()
          .mockResolvedValue(
            officialRow({ officialInvoiceRequestSent: true, officialInvoiceSentAt: new Date() }),
          ),
        update: vi.fn().mockResolvedValue(
          officialRow({
            officialInvoiceRequestSent: true,
            officialInvoiceSentAt: new Date(),
            govInvoiceId: 'ARM-99',
          }),
        ),
      },
    };
    await updateOfficialInvoiceGovId(prisma as never, 'inv-1', '  ARM-99  ');
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { govInvoiceId: 'ARM-99' } }),
    );
  });
});
