import { describe, expect, it } from 'vitest';
import { computeDealConstructorMoney } from './use-deal-constructor-money';
import {
  quoteSaleMissing,
  quoteSaleTotal,
  quoteUnitsTotal,
  visibleQuoteItemPrices,
} from './quote-totals';

describe('quoteSaleTotal', () => {
  it('adds published core and extra prices', () => {
    expect(
      quoteSaleTotal({
        coreVersionId: 'core-1',
        items: [{ functionId: 'fn-1', tierId: null }],
        canViewDraft: false,
        versions: [
          {
            targetKey: 'CORE:core-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '800000',
          },
          {
            targetKey: 'FUNCTION:fn-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '120000',
          },
        ],
      }),
    ).toBe('920000.00');
  });

  it('uses a chosen gradation price instead of the function card', () => {
    expect(
      quoteSaleTotal({
        coreVersionId: null,
        items: [{ functionId: 'fn-1', tierId: 'tier-1' }],
        canViewDraft: false,
        versions: [
          {
            targetKey: 'FUNCTION:fn-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '120000',
          },
          {
            targetKey: 'TIER:tier-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '200000',
          },
        ],
      }),
    ).toBe('200000.00');
  });

  it('returns null when any published price is missing', () => {
    expect(
      quoteSaleTotal({
        coreVersionId: 'core-1',
        items: [{ functionId: 'fn-1', tierId: null }],
        canViewDraft: false,
        versions: [
          {
            targetKey: 'CORE:core-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '800000',
          },
        ],
      }),
    ).toBeNull();
  });
});

describe('quoteSaleMissing', () => {
  it('names the core gap before extras', () => {
    expect(
      quoteSaleMissing({
        coreVersionId: 'core-1',
        items: [{ functionId: 'fn-1', tierId: null }],
        canViewDraft: false,
        versions: [
          {
            targetKey: 'FUNCTION:fn-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '120000',
          },
        ],
      }),
    ).toBe('core');
  });

  it('names an extra gap when the core price exists', () => {
    expect(
      quoteSaleMissing({
        coreVersionId: 'core-1',
        items: [{ functionId: 'fn-1', tierId: 'tier-1' }],
        canViewDraft: false,
        versions: [
          {
            targetKey: 'CORE:core-1',
            version: 1,
            status: 'PUBLISHED',
            resolvedAmount: '800000',
          },
        ],
      }),
    ).toBe('extra');
  });
});

describe('visibleQuoteItemPrices', () => {
  it('uses the chosen tier price', () => {
    const prices = visibleQuoteItemPrices({
      items: [{ functionId: 'fn-1', tierId: 'tier-1' }],
      canViewDraft: false,
      versions: [
        {
          targetKey: 'FUNCTION:fn-1',
          version: 1,
          status: 'PUBLISHED',
          resolvedAmount: '120000',
        },
        {
          targetKey: 'TIER:tier-1',
          version: 1,
          status: 'PUBLISHED',
          resolvedAmount: '200000',
        },
      ],
    });
    expect(prices.get('fn-1')?.amount).toBe('200000');
  });
});

describe('computeDealConstructorMoney', () => {
  it('keeps the recommended total unknown when the core price is missing', () => {
    const money = computeDealConstructorMoney({
      quote: {
        dealId: 'deal-1',
        appliedCollectionId: null,
        implementationBase: 'CODE',
        designMode: 'CLASSIC',
        aiDesignerReview: false,
        coreProfileVersionId: 'core-1',
        items: [{ functionId: 'fn-1', tierId: null }],
      },
      saleVersions: [
        {
          targetKey: 'FUNCTION:fn-1',
          version: 1,
          status: 'PUBLISHED',
          resolvedAmount: '120000',
        },
      ],
      coreUnits: 40,
      extraUnitsByFunctionId: new Map([['fn-1', 6]]),
      canSeeUnits: true,
    });
    expect(money.saleTotal).toBeNull();
    expect(money.saleMissing).toBe('core');
    expect(money.unitsTotal).toBe(46);
    expect(money.extraSalePrices.get('fn-1')?.amount).toBe('120000');
  });
});

describe('quoteUnitsTotal', () => {
  it('sums known core and extra units and skips gaps', () => {
    expect(quoteUnitsTotal({ coreUnits: 40, extraUnits: [6, undefined, 2] })).toBe(48);
    expect(quoteUnitsTotal({ coreUnits: undefined, extraUnits: [] })).toBeUndefined();
  });
});
