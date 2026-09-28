import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { assertFirstInvoiceMinimums } from './invoice-first-payment-minimums';

const POLICY_FROM = new Date('2020-01-01T00:00:00.000Z');

describe('assertFirstInvoiceMinimums', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.order.findUnique.mockResolvedValue({
      paymentType: 'CLASSIC',
      totalAmount: 500_000,
      deal: { source: 'SALES' },
    });
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      { sellerPercent: 10, assistantPercent: 2, effectiveFrom: POLICY_FROM, effectiveTo: null },
    ]);
  });

  it('rejects a first product invoice below the combined capped accrual', async () => {
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 59_999,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('allows equality with the combined Seller plus Assistant accrual', async () => {
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 60_000,
        type: 'DEVELOPMENT',
      }),
    ).resolves.toBeUndefined();
  });

  it('includes both role rates when one employee holds both', async () => {
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 59_999,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toThrow(/60000/);
  });

  it('caps the minimum at 300000 AMD when uncapped combined accrual is higher', async () => {
    prisma.order.findUnique.mockResolvedValue({
      paymentType: 'CLASSIC',
      totalAmount: 3_000_000,
      deal: { source: 'SALES' },
    });
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 299_999,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toThrow(/300000/);
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 300_000,
        type: 'DEVELOPMENT',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not apply a KPI factor to the creation minimum', async () => {
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 30_000,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toThrow(/60000/);
  });

  it('does not treat a domain invoice as the first product invoice', async () => {
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 1,
        type: 'DOMAIN',
      }),
    ).resolves.toBeUndefined();
    expect(prisma.salesBonusPolicy.findMany).not.toHaveBeenCalled();
  });

  it('still requires the minimum after only a domain invoice exists', async () => {
    prisma.invoice.findMany.mockResolvedValue([]);
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 1,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ignores cancelled product invoices when deciding if this is the first', async () => {
    prisma.invoice.findMany.mockResolvedValue([]);
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 1,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ['DEVELOPMENT', 'EXTENSION'] },
          moneyStatus: { not: 'CANCELLED' },
        }),
      }),
    );
  });

  it('blocks an ambiguous policy instead of guessing a minimum', async () => {
    prisma.salesBonusPolicy.findMany.mockResolvedValue([
      { sellerPercent: 10, assistantPercent: 2, effectiveFrom: POLICY_FROM },
      { sellerPercent: 8, assistantPercent: 2, effectiveFrom: POLICY_FROM },
    ]);
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 500_000,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toThrow(/two active Classic sales bonus policies/);
  });

  it('allows a later product invoice below the floor once a sibling already covers the minimum', async () => {
    prisma.invoice.findMany.mockResolvedValue([{ amount: 60_000 }]);
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 1_000,
        type: 'DEVELOPMENT',
      }),
    ).resolves.toBeUndefined();
  });

  it('keeps the floor when a sibling product invoice is below the current minimum', async () => {
    prisma.invoice.findMany.mockResolvedValue([{ amount: 50_000 }]);
    await expect(
      assertFirstInvoiceMinimums(prisma as never, {
        orderId: 'ord-1',
        amount: 1_000,
        type: 'DEVELOPMENT',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
