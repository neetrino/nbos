import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DealCommercialHandoffService } from './deal-commercial-handoff.service';

const createDealDepositInvoice = vi.fn();

vi.mock('./deal-deposit-invoice.ops', () => ({
  createDealDepositInvoice: (...args: unknown[]) => createDealDepositInvoice(...args),
}));

function productDeal(overrides?: { invoices?: Array<{ id: string }> }) {
  return {
    id: 'deal-1',
    type: 'PRODUCT',
    status: 'IN_PROGRESS',
    taxStatus: 'TAX',
    paymentType: 'SUBSCRIPTION',
    companyId: 'co-1',
    orders: [
      {
        id: 'ord-1',
        projectId: 'proj-1',
        invoices: overrides?.invoices ?? [],
      },
    ],
  };
}

describe('DealCommercialHandoffService.createDepositOrder', () => {
  const prisma = {
    deal: { findUnique: vi.fn() },
  };
  const officialWhatsApp = {
    enqueueIfAwaitingEligible: vi.fn().mockResolvedValue(undefined),
  };
  let service: DealCommercialHandoffService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DealCommercialHandoffService(
      prisma as never,
      { handle: vi.fn() } as never,
      { log: vi.fn() } as never,
      officialWhatsApp as never,
    );
  });

  it('passes the official notifier into deposit invoice persist', async () => {
    prisma.deal.findUnique.mockResolvedValue(productDeal());
    createDealDepositInvoice.mockResolvedValue({
      id: 'inv-1',
      moneyStatus: 'NEW',
    });

    await service.createDepositOrder('deal-1', { amount: 120_000 });

    expect(createDealDepositInvoice).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        orderId: 'ord-1',
        taxStatus: 'TAX',
        amount: 120_000,
      }),
      officialWhatsApp,
    );
  });

  it('skips create when the order already has an invoice', async () => {
    prisma.deal.findUnique.mockResolvedValue(productDeal({ invoices: [{ id: 'existing' }] }));

    await service.createDepositOrder('deal-1', { amount: 120_000 });

    expect(createDealDepositInvoice).not.toHaveBeenCalled();
  });
});
