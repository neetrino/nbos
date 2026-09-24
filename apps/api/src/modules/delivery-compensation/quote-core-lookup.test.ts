import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseDealQuotePreview, quoteAxesForPreview } from './quote-core-lookup';

const SAVED_SHOP = { productType: 'ECOMMERCE', productCategory: 'CODE' };

describe('parseDealQuotePreview', () => {
  it('ignores an empty query and uses the saved deal', () => {
    expect(parseDealQuotePreview({})).toBeNull();
    expect(parseDealQuotePreview({ productType: '  ', productCategory: '' })).toBeNull();
  });

  it('accepts a known type without a category', () => {
    expect(parseDealQuotePreview({ productType: 'BUSINESS_CARD_WEBSITE' })).toEqual({
      productType: 'BUSINESS_CARD_WEBSITE',
      productCategory: null,
    });
  });

  it('rejects an unknown type', () => {
    expect(() => parseDealQuotePreview({ productType: 'SHOP' })).toThrow(BadRequestException);
  });

  it('rejects an unknown category', () => {
    expect(() =>
      parseDealQuotePreview({ productType: 'LANDING', productCategory: 'SITE' }),
    ).toThrow(BadRequestException);
  });
});

describe('quoteAxesForPreview', () => {
  it('keeps saved extras when the selection matches the deal', () => {
    expect(
      quoteAxesForPreview(SAVED_SHOP, { productType: 'ECOMMERCE', productCategory: 'CODE' }),
    ).toEqual({ ...SAVED_SHOP, hideSavedExtras: false });
  });

  it('matches the selected type and hides extras saved for the previous type', () => {
    expect(
      quoteAxesForPreview(SAVED_SHOP, {
        productType: 'BUSINESS_CARD_WEBSITE',
        productCategory: 'CODE',
      }),
    ).toEqual({
      productType: 'BUSINESS_CARD_WEBSITE',
      productCategory: 'CODE',
      hideSavedExtras: true,
    });
  });

  it('uses the saved deal when the form has not sent a preview', () => {
    expect(quoteAxesForPreview(SAVED_SHOP, null)).toEqual({
      ...SAVED_SHOP,
      hideSavedExtras: false,
    });
  });
});
