import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  applyInvoiceGeneralUpdate,
  parseUpdateInvoiceGeneralInput,
} from './invoice-general-update';

describe('parseUpdateInvoiceGeneralInput', () => {
  it('accepts amount and taxStatus', () => {
    expect(parseUpdateInvoiceGeneralInput({ amount: 1000, taxStatus: 'TAX_FREE' })).toEqual({
      amount: 1000,
      taxStatus: 'TAX_FREE',
    });
  });

  it('rejects non-positive amount', () => {
    expect(() => parseUpdateInvoiceGeneralInput({ amount: 0 })).toThrow(BadRequestException);
  });

  it('rejects unknown taxStatus', () => {
    expect(() => parseUpdateInvoiceGeneralInput({ taxStatus: 'VAT' })).toThrow(BadRequestException);
  });

  it('rejects empty patch', () => {
    expect(() => parseUpdateInvoiceGeneralInput({})).toThrow(BadRequestException);
  });

  it('accepts a deal/order accountant note', () => {
    expect(parseUpdateInvoiceGeneralInput({ orderComment: 'FIRST_PHASE' })).toEqual({
      orderComment: 'FIRST_PHASE',
    });
  });

  it('accepts productId', () => {
    expect(parseUpdateInvoiceGeneralInput({ productId: 'prod-1' })).toEqual({
      productId: 'prod-1',
    });
  });

  it('rejects an unknown accountant note', () => {
    expect(() => parseUpdateInvoiceGeneralInput({ orderComment: 'OTHER' })).toThrow(
      BadRequestException,
    );
  });
});

describe('applyInvoiceGeneralUpdate', () => {
  it('rewrites denormalized projectId when Manual product changes', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-1',
          type: 'MANUAL',
          orderId: null,
          amount: 1000,
          taxStatus: 'TAX_FREE',
          moneyStatus: 'NEW',
          officialInvoiceRequestSent: false,
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      product: {
        findUnique: vi.fn().mockResolvedValue({
          projectId: 'proj-2',
          companyId: 'co-2',
          project: { companyId: 'co-project' },
        }),
      },
      order: { findUnique: vi.fn() },
      subscription: { findUnique: vi.fn() },
      clientServiceRecord: { findUnique: vi.fn() },
    };

    await applyInvoiceGeneralUpdate(prisma as never, 'inv-1', { productId: 'prod-2' });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        product: { connect: { id: 'prod-2' } },
        project: { connect: { id: 'proj-2' } },
        company: { connect: { id: 'co-2' } },
      },
    });
  });

  it('allows company on a domain invoice', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-domain',
          type: 'DOMAIN',
          orderId: null,
          amount: 1000,
          taxStatus: 'TAX',
          moneyStatus: 'NEW',
          officialInvoiceRequestSent: false,
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await applyInvoiceGeneralUpdate(prisma as never, 'inv-domain', { companyId: 'co-1' });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-domain' },
      data: { company: { connect: { id: 'co-1' } } },
    });
  });

  it('rejects product changes on a domain invoice', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-domain',
          type: 'DOMAIN',
          orderId: null,
          amount: 1000,
          taxStatus: 'TAX',
          moneyStatus: 'NEW',
          officialInvoiceRequestSent: false,
          payments: [],
        }),
        update: vi.fn(),
      },
    };

    await expect(
      applyInvoiceGeneralUpdate(prisma as never, 'inv-domain', { productId: 'prod-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('rejects product relink after Awaiting Payment', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-1',
          type: 'MANUAL',
          orderId: null,
          amount: 1000,
          taxStatus: 'TAX_FREE',
          moneyStatus: 'AWAITING_PAYMENT',
          officialInvoiceRequestSent: false,
          payments: [],
        }),
        update: vi.fn(),
      },
    };

    await expect(
      applyInvoiceGeneralUpdate(prisma as never, 'inv-1', { productId: 'prod-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('rejects company change after Paid', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-1',
          type: 'MANUAL',
          orderId: null,
          amount: 1000,
          taxStatus: 'TAX',
          moneyStatus: 'PAID',
          officialInvoiceRequestSent: true,
          payments: [{ amount: 1000 }],
        }),
        update: vi.fn(),
      },
    };

    await expect(
      applyInvoiceGeneralUpdate(prisma as never, 'inv-1', { companyId: 'co-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('still allows amount on an issued invoice', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-1',
          type: 'MANUAL',
          orderId: null,
          amount: 1000,
          taxStatus: 'TAX',
          moneyStatus: 'AWAITING_PAYMENT',
          officialInvoiceRequestSent: true,
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await applyInvoiceGeneralUpdate(prisma as never, 'inv-1', { amount: 1200 });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { amount: 1200 },
    });
  });
});
