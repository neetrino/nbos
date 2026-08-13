import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrderForDeal } from './deal-order-bootstrap.ops';

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

  it('keeps full contract total and copies subscriptionTermMonths', async () => {
    await createOrderForDeal(prisma as never, {
      deal: {
        id: 'deal-1',
        code: 'D-2026-0001',
        type: 'PRODUCT',
        amount: 6_000_000,
        paymentType: 'SUBSCRIPTION',
        subscriptionTermMonths: 6,
        taxStatus: 'TAX',
        projectId: 'proj-1',
        contactId: 'contact-1',
        companyId: 'company-1',
        name: 'Website',
        sourcePartnerId: null,
      },
      totalAmount: 6_000_000,
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

  it('stores null term for open-ended deals', async () => {
    await createOrderForDeal(prisma as never, {
      deal: {
        id: 'deal-2',
        code: 'D-2026-0002',
        type: 'PRODUCT',
        amount: 5_000,
        paymentType: 'CLASSIC',
        subscriptionTermMonths: null,
        taxStatus: 'TAX',
        projectId: 'proj-1',
        contactId: 'contact-1',
        companyId: null,
        name: 'Classic',
        sourcePartnerId: null,
      },
      totalAmount: 5_000,
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
