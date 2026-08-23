import { describe, expect, it, vi } from 'vitest';
import { createDealDepositInvoice } from './deal-deposit-invoice.ops';

describe('createDealDepositInvoice', () => {
  it('creates Tax invoices in New when company requisites are missing', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ next_value: 1 }]),
      invoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'inv-1', moneyStatus: 'NEW' }),
      },
      company: {
        findUnique: vi.fn().mockResolvedValue({ name: 'LLC', taxId: null }),
      },
    };

    await createDealDepositInvoice(prisma as never, {
      orderId: 'ord-1',
      projectId: 'proj-1',
      companyId: 'c1',
      amount: 1000,
      type: 'DEVELOPMENT',
      taxStatus: 'TAX',
    });

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ moneyStatus: 'NEW' }),
      }),
    );
  });

  it('creates Tax invoices in Awaiting Payment when requisites are ready', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ next_value: 1 }]),
      invoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'inv-1', moneyStatus: 'AWAITING_PAYMENT' }),
      },
      company: {
        findUnique: vi.fn().mockResolvedValue({ name: 'InvestOn LLC', taxId: '01234567' }),
      },
    };

    await createDealDepositInvoice(prisma as never, {
      orderId: 'ord-1',
      projectId: 'proj-1',
      companyId: 'c1',
      amount: 1000,
      type: 'DEVELOPMENT',
      taxStatus: 'TAX',
    });

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ moneyStatus: 'AWAITING_PAYMENT' }),
      }),
    );
  });
});
