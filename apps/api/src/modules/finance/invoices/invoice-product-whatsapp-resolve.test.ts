import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';

describe('resolveInvoiceProductWhatsAppGroup', () => {
  const prisma = {
    invoice: { findUnique: vi.fn() },
    productCommunicationBinding: { findUnique: vi.fn() },
    whatsAppGatewayConnection: { findFirst: vi.fn() },
  };

  beforeEach(() => {
    prisma.invoice.findUnique.mockReset();
    prisma.productCommunicationBinding.findUnique.mockReset();
    prisma.whatsAppGatewayConnection.findFirst.mockReset();
    prisma.whatsAppGatewayConnection.findFirst.mockResolvedValue({
      accountingGroupChatId: null,
    });
  });

  it('uses Client Service Record productId when there is no subscription', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      subscription: null,
      clientServiceRecord: { productId: 'prod-csr' },
      order: null,
    });
    prisma.productCommunicationBinding.findUnique.mockResolvedValue({
      conversationId: 'conv-1',
      conversation: {
        externalMappings: [{ externalAccountId: 'acc', externalConversationId: '120363@g.us' }],
      },
    });

    const result = await resolveInvoiceProductWhatsAppGroup(prisma as never, 'inv-1');

    expect(result).toEqual({
      productId: 'prod-csr',
      groupChatId: '120363@g.us',
      conversationId: 'conv-1',
    });
    expect(prisma.productCommunicationBinding.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId_purpose: { productId: 'prod-csr', purpose: 'FINANCE' } },
      }),
    );
  });

  it('prefers subscription productId over Client Service Record', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      subscription: { productId: 'prod-sub' },
      clientServiceRecord: { productId: 'prod-csr' },
      order: { productId: 'prod-order' },
    });
    prisma.productCommunicationBinding.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        conversationId: 'conv-sub',
        conversation: {
          externalMappings: [{ externalAccountId: 'acc', externalConversationId: 'sub@g.us' }],
        },
      });

    const result = await resolveInvoiceProductWhatsAppGroup(prisma as never, 'inv-1');

    expect(result?.productId).toBe('prod-sub');
    expect(result?.groupChatId).toBe('sub@g.us');
  });

  it('falls back to WORK when FINANCE is not explicit', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      subscription: { productId: 'prod-sub' },
      clientServiceRecord: null,
      order: null,
    });
    prisma.productCommunicationBinding.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        conversationId: 'conv-work',
        conversation: {
          externalMappings: [{ externalAccountId: 'acc', externalConversationId: 'work@g.us' }],
        },
      });

    const result = await resolveInvoiceProductWhatsAppGroup(prisma as never, 'inv-1');
    expect(result).toEqual({
      productId: 'prod-sub',
      groupChatId: 'work@g.us',
      conversationId: 'conv-work',
    });
  });

  it('does not return WORK JID when it equals the accountant group', async () => {
    const accountant = '120363000000000000@g.us';
    prisma.invoice.findUnique.mockResolvedValue({
      subscription: { productId: 'prod-sub' },
      clientServiceRecord: null,
      order: null,
    });
    prisma.whatsAppGatewayConnection.findFirst.mockResolvedValue({
      accountingGroupChatId: accountant,
    });
    prisma.productCommunicationBinding.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        conversationId: 'conv-work',
        conversation: {
          externalMappings: [{ externalAccountId: 'acc', externalConversationId: accountant }],
        },
      });

    const result = await resolveInvoiceProductWhatsAppGroup(prisma as never, 'inv-1');
    expect(result).toBeNull();
  });
});
