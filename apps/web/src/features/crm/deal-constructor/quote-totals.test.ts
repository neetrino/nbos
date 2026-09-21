import { describe, expect, it } from 'vitest';
import { quoteSaleTotal, quoteUnitsTotal } from './quote-totals';

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

describe('quoteUnitsTotal', () => {
  it('sums known core and extra units and skips gaps', () => {
    expect(quoteUnitsTotal({ coreUnits: 40, extraUnits: [6, undefined, 2] })).toBe(48);
    expect(quoteUnitsTotal({ coreUnits: undefined, extraUnits: [] })).toBeUndefined();
  });
});
