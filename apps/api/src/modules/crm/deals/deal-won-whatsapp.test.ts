import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  getDealWonWhatsAppErrors,
  loadDealWonWhatsAppContext,
  resolveDealProductIdForWhatsApp,
  resolveWonWhatsAppIntent,
  validateDealWonWhatsAppGate,
} from './deal-won-whatsapp';

const productGate = {
  dealType: 'PRODUCT',
  productId: null,
  groupChatId: null,
  hasCreateOperation: false,
};

describe('deal-won-whatsapp gate', () => {
  it('does not apply to MAINTENANCE or EXTENSION', () => {
    expect(getDealWonWhatsAppErrors({ ...productGate, dealType: 'MAINTENANCE' })).toEqual([]);
    expect(getDealWonWhatsAppErrors({ ...productGate, dealType: 'EXTENSION' })).toEqual([]);
  });

  it('blocks PRODUCT/OUTSOURCE without create-or-id', () => {
    expect(getDealWonWhatsAppErrors(productGate).length).toBeGreaterThan(0);
    expect(
      getDealWonWhatsAppErrors({ ...productGate, dealType: 'OUTSOURCE' }).length,
    ).toBeGreaterThan(0);
    expect(() => validateDealWonWhatsAppGate(productGate)).toThrow(BadRequestException);
  });

  it('allows after a FAILED create operation', () => {
    expect(
      getDealWonWhatsAppErrors({
        ...productGate,
        productId: 'p1',
        hasCreateOperation: true,
      }),
    ).toEqual([]);
  });

  it('allows after a persisted groupChatId', () => {
    expect(
      getDealWonWhatsAppErrors({
        ...productGate,
        productId: 'p1',
        groupChatId: '120363012345678901@g.us',
      }),
    ).toEqual([]);
  });

  it('allows create or bind action when the product shell does not exist yet', () => {
    expect(getDealWonWhatsAppErrors({ ...productGate, whatsappAction: 'create' })).toEqual([]);
    expect(
      getDealWonWhatsAppErrors({
        ...productGate,
        whatsappAction: 'bind',
        whatsappGroupChatId: '120363012345678901',
      }),
    ).toEqual([]);
  });

  it('rejects bind without a valid group id', () => {
    expect(
      getDealWonWhatsAppErrors({
        ...productGate,
        whatsappAction: 'bind',
        whatsappGroupChatId: 'nope',
      }).length,
    ).toBeGreaterThan(0);
  });

  it('resolves product from existingProductId then order.productId', () => {
    expect(resolveDealProductIdForWhatsApp({ existingProductId: 'p1' })).toBe('p1');
    expect(
      resolveDealProductIdForWhatsApp({
        existingProductId: null,
        orders: [{ productId: 'p2' }],
      }),
    ).toBe('p2');
  });

  it('defaults Won intent to bind the existing Deal group', () => {
    expect(
      resolveWonWhatsAppIntent({
        contextGroupChatId: '120363012345678901@g.us',
      }),
    ).toEqual({
      action: 'bind',
      groupChatId: '120363012345678901@g.us',
      actorId: undefined,
    });
    expect(
      resolveWonWhatsAppIntent({
        action: 'create',
        contextGroupChatId: '120363012345678901@g.us',
      }),
    ).toEqual({
      action: 'create',
      groupChatId: undefined,
      actorId: undefined,
    });
  });
});

describe('loadDealWonWhatsAppContext', () => {
  it('prefers WORK communication destination over legacy groupChatId', async () => {
    const prisma = {
      dealWhatsAppGroupBinding: { findUnique: async () => null },
      productWhatsAppGroupBinding: {
        findUnique: async () => ({ groupChatId: 'legacy@g.us' }),
      },
      whatsAppGroupOperation: { findFirst: async () => null },
      whatsAppGatewayConnection: {
        findFirst: async () => ({ accountingGroupChatId: null }),
      },
      productCommunicationBinding: {
        findUnique: async () => ({
          conversationId: 'conv-work',
          conversation: {
            externalMappings: [{ externalAccountId: 'acc', externalConversationId: 'work@g.us' }],
          },
        }),
      },
    };
    const ctx = await loadDealWonWhatsAppContext(prisma as never, {
      id: 'deal-1',
      existingProductId: 'p1',
    });
    expect(ctx.groupChatId).toBe('work@g.us');
    expect(ctx.productId).toBe('p1');
  });

  it('does not treat unique-legacy accountant JID as Product groupChatId', async () => {
    const prisma = {
      dealWhatsAppGroupBinding: { findUnique: async () => null },
      productWhatsAppGroupBinding: {
        findUnique: async () => ({ groupChatId: '120363000000000000@g.us' }),
      },
      whatsAppGroupOperation: { findFirst: async () => null },
      whatsAppGatewayConnection: {
        findFirst: async () => ({ accountingGroupChatId: '120363000000000000@g.us' }),
      },
      productCommunicationBinding: { findUnique: async () => null },
    };
    const ctx = await loadDealWonWhatsAppContext(prisma as never, {
      id: 'deal-1',
      existingProductId: 'p1',
    });
    expect(ctx.groupChatId).toBeNull();
    expect(ctx.groupChatId).not.toBe('120363000000000000@g.us');
    expect(ctx.productId).toBe('p1');
  });

  it('returns null when WORK mapping JID equals the accountant group', async () => {
    const accountant = '120363000000000000@g.us';
    const prisma = {
      dealWhatsAppGroupBinding: { findUnique: async () => null },
      productWhatsAppGroupBinding: {
        findUnique: async () => ({ groupChatId: accountant }),
      },
      whatsAppGroupOperation: { findFirst: async () => null },
      whatsAppGatewayConnection: {
        findFirst: async () => ({ accountingGroupChatId: accountant }),
      },
      productCommunicationBinding: {
        findUnique: async () => ({
          conversationId: 'conv-work',
          conversation: {
            externalMappings: [{ externalAccountId: 'acc', externalConversationId: accountant }],
          },
        }),
      },
    };
    const ctx = await loadDealWonWhatsAppContext(prisma as never, {
      id: 'deal-1',
      existingProductId: 'p1',
    });
    expect(ctx.groupChatId).toBeNull();
    expect(ctx.groupChatId).not.toBe(accountant);
  });

  it('falls back to the Deal binding when Product WORK is not mapped yet', async () => {
    const prisma = {
      dealWhatsAppGroupBinding: {
        findUnique: async () => ({
          groupChatId: '120363012345678901@g.us',
          status: 'ACTIVE',
        }),
      },
      productWhatsAppGroupBinding: { findUnique: async () => null },
      whatsAppGroupOperation: { findFirst: async () => null },
      whatsAppGatewayConnection: {
        findFirst: async () => ({ accountingGroupChatId: null }),
      },
      productCommunicationBinding: { findUnique: async () => null },
    };
    const ctx = await loadDealWonWhatsAppContext(prisma as never, {
      id: 'deal-1',
      existingProductId: 'p1',
    });
    expect(ctx.groupChatId).toBe('120363012345678901@g.us');
    expect(ctx.hasCreateOperation).toBe(false);
  });
});
