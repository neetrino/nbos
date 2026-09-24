import { describe, expect, it } from 'vitest';
import type { DeliveryFunctionPriceFinancialDto } from '@nbos/shared';
import {
  functionUnitCardModel,
  initialTierSelection,
  pairForSelection,
  representativePair,
  type FunctionUnitCardModel,
} from './function-unit-focus';
import type { LiveFunctionPrice } from './live-function-prices';

function price(id: string, status: string): DeliveryFunctionPriceFinancialDto {
  return {
    id,
    functionId: 'fn',
    tierId: null,
    status,
    roleUnits: [{ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '4' }],
  } as DeliveryFunctionPriceFinancialDto;
}

function pair(
  functionId: string,
  tierId: string | null,
  draft: DeliveryFunctionPriceFinancialDto | null,
  published: DeliveryFunctionPriceFinancialDto | null,
): LiveFunctionPrice {
  return { key: `${functionId}:${tierId ?? ''}`, functionId, tierId, draft, published };
}

describe('function unit focus', () => {
  it('prefers a draft over a published vector on the card', () => {
    const pairs = [
      pair('fn', 'site', null, price('pub', 'PUBLISHED')),
      pair('fn', 'shop', price('draft', 'DRAFT'), null),
    ];
    expect(representativePair(pairs)?.draft?.id).toBe('draft');
    const card: FunctionUnitCardModel = functionUnitCardModel(
      { id: 'fn', title: 'Payments', iconKey: 'CreditCard' },
      pairs,
    );
    expect(card.status).toBe('DRAFT');
    expect(card.unitsTotal).toBe('4.0000');
    expect(card.draftId).toBe('draft');
  });

  it('opens the volume that already has a norm', () => {
    const item = { tiers: [{ id: 'site' }, { id: 'shop' }] };
    const pairs = [pair('fn', 'shop', null, price('pub', 'PUBLISHED'))];
    expect(initialTierSelection(item, pairs)).toBe('shop');
    expect(pairForSelection(item, pairs, 'shop')?.published?.id).toBe('pub');
    expect(pairForSelection(item, pairs, 'none')).toBeNull();
  });

  it('leaves an unconfigured function empty', () => {
    const card = functionUnitCardModel({ id: 'fn', title: 'Empty', iconKey: 'Layers' }, []);
    expect(card.unitsTotal).toBeNull();
    expect(card.status).toBeNull();
    expect(card.draftId).toBeNull();
  });
});
