import { describe, expect, it } from 'vitest';
import { billableQuoteItems, splitDealFunctions } from './split-deal-composition';

const CATALOG = [
  { id: 'base', title: 'Portal' },
  { id: 'extra', title: 'Coupons' },
];

describe('splitDealFunctions', () => {
  it('keeps base functions out of the extra list', () => {
    const parts = splitDealFunctions(CATALOG, new Set(['base', 'extra']), ['base']);
    expect(parts.base.map((item) => item.id)).toEqual(['base']);
    expect(parts.extras.map((item) => item.id)).toEqual(['extra']);
  });

  it('shows a base function even when the deal has not selected it', () => {
    const parts = splitDealFunctions(CATALOG, new Set(), ['base']);
    expect(parts.base).toHaveLength(1);
    expect(parts.extras).toHaveLength(0);
  });
});

describe('billableQuoteItems', () => {
  it('drops functions whose cost is already inside the core', () => {
    const items = billableQuoteItems(
      [
        { functionId: 'base', tierId: null },
        { functionId: 'extra', tierId: 'tier-1' },
      ],
      ['base'],
    );
    expect(items).toEqual([{ functionId: 'extra', tierId: 'tier-1' }]);
  });
});
