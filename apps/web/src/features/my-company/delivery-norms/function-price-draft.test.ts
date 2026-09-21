import { describe, expect, it } from 'vitest';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import {
  defaultFunctionPriceTierId,
  functionPriceRowTitle,
  functionPriceTierOptions,
  resolvedFunctionPriceTierId,
  selectedCatalogFunction,
} from './function-price-draft';

const CARD: DeliveryFunctionOperationalDto = {
  id: 'fn-1',
  code: 'CNT_MULTILINGUAL',
  category: 'content',
  iconKey: 'languages',
  status: 'ACTIVE',
  title: 'Multilingual',
  summary: '',
  scopeBoundaries: '',
  instructions: '',
  acceptanceCriteria: '',
  contentVersion: 1,
  tiers: [
    { id: 'tier-site', code: 'SITE', label: 'Site', position: 0 },
    { id: 'tier-shop', code: 'SHOP', label: 'Shop', position: 1 },
  ],
  attachments: [],
};

const PLAIN: DeliveryFunctionOperationalDto = { ...CARD, id: 'fn-2', tiers: [] };

describe('function price draft helpers', () => {
  it('finds the selected catalog card', () => {
    expect(selectedCatalogFunction([CARD, PLAIN], 'fn-1')?.code).toBe('CNT_MULTILINGUAL');
    expect(selectedCatalogFunction([CARD], OPTIONAL_SELECT_NONE)).toBeUndefined();
  });

  it('defaults the only volume and leaves several unset', () => {
    expect(defaultFunctionPriceTierId(PLAIN)).toBe(OPTIONAL_SELECT_NONE);
    expect(defaultFunctionPriceTierId({ ...CARD, tiers: CARD.tiers.slice(0, 1) })).toBe(
      'tier-site',
    );
    expect(defaultFunctionPriceTierId(CARD)).toBe(OPTIONAL_SELECT_NONE);
  });

  it('requires a belonging volume when the card has gradations', () => {
    expect(resolvedFunctionPriceTierId(PLAIN, OPTIONAL_SELECT_NONE)).toEqual({
      ok: true,
      tierId: null,
    });
    expect(resolvedFunctionPriceTierId(CARD, OPTIONAL_SELECT_NONE)).toEqual({ ok: false });
    expect(resolvedFunctionPriceTierId(CARD, 'tier-shop')).toEqual({
      ok: true,
      tierId: 'tier-shop',
    });
    expect(functionPriceTierOptions(CARD)).toEqual([
      { value: 'tier-site', label: 'Site' },
      { value: 'tier-shop', label: 'Shop' },
    ]);
  });

  it('appends the volume label on a priced row', () => {
    expect(functionPriceRowTitle('Multilingual', null, CARD.tiers)).toBe('Multilingual');
    expect(functionPriceRowTitle('Multilingual', 'tier-shop', CARD.tiers)).toBe(
      'Multilingual · Shop',
    );
  });
});
