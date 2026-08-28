import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';

describe('resolveInvoiceProductWhatsAppGroup', () => {
  const prisma = {
    invoice: { findUnique: vi.fn() },
    productWhatsAppGroupBinding: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    prisma.invoice.findUnique.mockReset();
    prisma.productWhatsAppGroupBinding.findUnique.mockReset();
  });

  it('uses Client Service Record productId when there is no subscription', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      subscription: null,
      clientServiceRecord: { productId: 'prod-csr' },
      order: null,
    });
    prisma.productWhatsAppGroupBinding.findUnique.mockResolvedValue({
      groupChatId: '120363@g.us',
      status: 'ACTIVE',
    });

    const result = await resolveInvoiceProductWhatsAppGroup(prisma as never, 'inv-1');

    expect(result).toEqual({ productId: 'prod-csr', groupChatId: '120363@g.us' });
    expect(prisma.productWhatsAppGroupBinding.findUnique).toHaveBeenCalledWith({
      where: { productId: 'prod-csr' },
      select: { groupChatId: true, status: true },
    });
  });

  it('prefers subscription productId over Client Service Record', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      subscription: { productId: 'prod-sub' },
      clientServiceRecord: { productId: 'prod-csr' },
      order: { productId: 'prod-order' },
    });
    prisma.productWhatsAppGroupBinding.findUnique.mockResolvedValue({
      groupChatId: 'sub@g.us',
      status: 'ACTIVE',
    });

    const result = await resolveInvoiceProductWhatsAppGroup(prisma as never, 'inv-1');

    expect(result?.productId).toBe('prod-sub');
  });
});
