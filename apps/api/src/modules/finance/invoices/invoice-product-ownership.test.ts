import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  requireInvoiceProductId,
  resolveInvoiceProductOwnership,
} from './invoice-product-ownership';

describe('resolveInvoiceProductOwnership', () => {
  const prisma = {
    product: { findUnique: vi.fn() },
    order: { findUnique: vi.fn() },
    subscription: { findUnique: vi.fn() },
    clientServiceRecord: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.order.findUnique.mockReset();
    prisma.subscription.findUnique.mockReset();
    prisma.clientServiceRecord.findUnique.mockReset();
    prisma.product.findUnique.mockResolvedValue({ projectId: 'proj-1' });
  });

  it('resolves from order.productId', async () => {
    prisma.order.findUnique.mockResolvedValue({
      productId: 'prod-order',
      extension: null,
    });

    await expect(
      resolveInvoiceProductOwnership(prisma as never, { orderId: 'ord-1' }),
    ).resolves.toEqual({ productId: 'prod-order', projectId: 'proj-1' });
  });

  it('resolves from order extension product when order has no product', async () => {
    prisma.order.findUnique.mockResolvedValue({
      productId: null,
      extension: { productId: 'prod-ext' },
    });

    await expect(
      resolveInvoiceProductOwnership(prisma as never, { orderId: 'ord-1' }),
    ).resolves.toEqual({ productId: 'prod-ext', projectId: 'proj-1' });
  });

  it('resolves from subscription.productId', async () => {
    prisma.subscription.findUnique.mockResolvedValue({ productId: 'prod-sub' });

    await expect(
      resolveInvoiceProductOwnership(prisma as never, { subscriptionId: 'sub-1' }),
    ).resolves.toEqual({ productId: 'prod-sub', projectId: 'proj-1' });
  });

  it('resolves from client service productId', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue({ productId: 'prod-csr' });

    await expect(
      resolveInvoiceProductOwnership(prisma as never, { clientServiceRecordId: 'csr-1' }),
    ).resolves.toEqual({ productId: 'prod-csr', projectId: 'proj-1' });
  });

  it('uses explicit productId when sources are empty', async () => {
    await expect(
      resolveInvoiceProductOwnership(prisma as never, { productId: 'prod-manual' }),
    ).resolves.toEqual({ productId: 'prod-manual', projectId: 'proj-1' });
  });

  it('rejects when explicit product conflicts with source product', async () => {
    prisma.order.findUnique.mockResolvedValue({
      productId: 'prod-order',
      extension: null,
    });

    await expect(
      resolveInvoiceProductOwnership(prisma as never, {
        productId: 'prod-other',
        orderId: 'ord-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns nulls when no product can be resolved', async () => {
    await expect(resolveInvoiceProductOwnership(prisma as never, {})).resolves.toEqual({
      productId: null,
      projectId: null,
    });
  });
});

describe('requireInvoiceProductId', () => {
  it('returns the product id', () => {
    expect(requireInvoiceProductId('prod-1')).toBe('prod-1');
  });

  it('rejects a missing product', () => {
    expect(() => requireInvoiceProductId(null)).toThrow(BadRequestException);
  });
});
