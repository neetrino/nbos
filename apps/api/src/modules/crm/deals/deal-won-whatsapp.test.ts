import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  getDealWonWhatsAppErrors,
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
