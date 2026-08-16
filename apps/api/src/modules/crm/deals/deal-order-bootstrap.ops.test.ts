import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrderForDeal, resolveDealOrderTotalAmount } from './deal-order-bootstrap.ops';

describe('resolveDealOrderTotalAmount', () => {
  it('derives contract total for SUBSCRIPTION deals with a term', () => {
    expect(
      resolveDealOrderTotalAmount({
        amount: 1_000_000,
        paymentType: 'SUBSCRIPTION',
        subscriptionTermMonths: 6,
      }),
    ).toBe(6_000_000);
  });

  it('keeps period amount for SUBSCRIPTION deals without a term', () => {
    expect(
      resolveDealOrderTotalAmount({
        amount: 5_000,
        paymentType: 'SUBSCRIPTION',
        subscriptionTermMonths: null,
      }),
    ).toBe(5_000);
  });

  it('keeps deal amount for CLASSIC deals', () => {
    expect(
      resolveDealOrderTotalAmount({
        amount: 6_000_000,
        paymentType: 'CLASSIC',
        subscriptionTermMonths: 6,
      }),
    ).toBe(6_000_000);
  });
});

describe('createOrderForDeal', () => {
  const prisma = {
    order: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.order.findFirst.mockResolvedValue(null);
    prisma.order.create.mockResolvedValue({
      id: 'ord-1',
      code: 'ORD-2026-0001',
      projectId: 'proj-1',
    });
  });

  it('stores derived contract total and copies subscriptionTermMonths', async () => {
    const deal = {
      id: 'deal-1',
      code: 'D-2026-0001',
      type: 'PRODUCT' as const,
      amount: 1_000_000,
      paymentType: 'SUBSCRIPTION' as const,
      subscriptionTermMonths: 6,
      taxStatus: 'TAX' as const,
      projectId: 'proj-1',
      contactId: 'contact-1',
      companyId: 'company-1',
      name: 'Website',
      sourcePartnerId: null,
    };

    await createOrderForDeal(prisma as never, {
      deal,
      totalAmount: resolveDealOrderTotalAmount(deal),
      paymentMode: 'STANDARD_PREPAY',
      deliveryStartMode: 'AFTER_PAYMENT',
      status: 'PENDING_PAYMENT',
    });

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 6_000_000,
          subscriptionTermMonths: 6,
          paymentType: 'SUBSCRIPTION',
        }),
      }),
    );
  });

  it('stores null term and unchanged total for CLASSIC deals', async () => {
    const deal = {
      id: 'deal-2',
      code: 'D-2026-0002',
      type: 'PRODUCT' as const,
      amount: 5_000,
      paymentType: 'CLASSIC' as const,
      subscriptionTermMonths: null,
      taxStatus: 'TAX' as const,
      projectId: 'proj-1',
      contactId: 'contact-1',
      companyId: null,
      name: 'Classic',
      sourcePartnerId: null,
    };

    await createOrderForDeal(prisma as never, {
      deal,
      totalAmount: resolveDealOrderTotalAmount(deal),
      paymentMode: 'STANDARD_PREPAY',
      deliveryStartMode: 'AFTER_PAYMENT',
      status: 'PENDING_PAYMENT',
    });

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 5_000,
          subscriptionTermMonths: null,
        }),
      }),
    );
  });
});
