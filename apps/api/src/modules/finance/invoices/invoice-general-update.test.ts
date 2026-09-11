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
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      product: { findUnique: vi.fn().mockResolvedValue({ projectId: 'proj-2' }) },
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
      },
    });
  });
});
