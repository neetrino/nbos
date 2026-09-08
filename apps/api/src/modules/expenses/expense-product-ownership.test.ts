import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveExpenseProductOwnership } from './expense-product-ownership';

describe('resolveExpenseProductOwnership', () => {
  const prisma = {
    product: { findUnique: vi.fn() },
    expensePlan: { findUnique: vi.fn() },
    clientServiceRecord: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.expensePlan.findUnique.mockReset();
    prisma.clientServiceRecord.findUnique.mockReset();
    prisma.product.findUnique.mockResolvedValue({ projectId: 'proj-1' });
  });

  it('resolves from expense plan productId', async () => {
    prisma.expensePlan.findUnique.mockResolvedValue({ productId: 'prod-plan' });

    await expect(
      resolveExpenseProductOwnership(prisma as never, { expensePlanId: 'plan-1' }),
    ).resolves.toEqual({ productId: 'prod-plan', projectId: 'proj-1' });
  });

  it('resolves from client service productId', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue({ productId: 'prod-csr' });

    await expect(
      resolveExpenseProductOwnership(prisma as never, { clientServiceRecordId: 'csr-1' }),
    ).resolves.toEqual({ productId: 'prod-csr', projectId: 'proj-1' });
  });

  it('uses explicit productId when sources are empty', async () => {
    await expect(
      resolveExpenseProductOwnership(prisma as never, { productId: 'prod-manual' }),
    ).resolves.toEqual({ productId: 'prod-manual', projectId: 'proj-1' });
  });

  it('rejects when explicit product conflicts with source product', async () => {
    prisma.expensePlan.findUnique.mockResolvedValue({ productId: 'prod-plan' });

    await expect(
      resolveExpenseProductOwnership(prisma as never, {
        productId: 'prod-other',
        expensePlanId: 'plan-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns nulls when no product can be resolved', async () => {
    await expect(resolveExpenseProductOwnership(prisma as never, {})).resolves.toEqual({
      productId: null,
      projectId: null,
    });
  });
});
