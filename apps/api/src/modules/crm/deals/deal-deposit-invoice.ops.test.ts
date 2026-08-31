import { describe, expect, it, vi } from 'vitest';
import { createDealDepositInvoice } from './deal-deposit-invoice.ops';

function depositPrisma(moneyStatus: string) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ next_value: 1 }]),
    invoice: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'inv-1', moneyStatus }),
    },
  };
}

describe('createDealDepositInvoice', () => {
  it('creates manual deal invoices in New', async () => {
    const prisma = depositPrisma('NEW');

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

  it('does not auto-send the accountant on create', async () => {
    const notifier = { enqueueIfAwaitingEligible: vi.fn().mockResolvedValue(undefined) };
    const prisma = depositPrisma('NEW');

    await createDealDepositInvoice(
      prisma as never,
      {
        orderId: 'ord-1',
        projectId: 'proj-1',
        companyId: 'c1',
        amount: 1000,
        type: 'DEVELOPMENT',
        taxStatus: 'TAX',
      },
      notifier,
    );

    expect(notifier.enqueueIfAwaitingEligible).not.toHaveBeenCalled();
  });
});
