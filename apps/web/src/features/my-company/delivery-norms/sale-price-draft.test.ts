import { describe, expect, it } from 'vitest';
import {
  gradationsFromCatalog,
  parseSalePriceTargetKey,
  targetKeyForKind,
} from './sale-price-draft';

describe('sale price target keys', () => {
  it('builds and parses function, tier and core keys', () => {
    expect(targetKeyForKind('FUNCTION', 'fn-1')).toBe('FUNCTION:fn-1');
    expect(targetKeyForKind('TIER', 'tier-1')).toBe('TIER:tier-1');
    expect(targetKeyForKind('CORE', 'core-1')).toBe('CORE:core-1');
    expect(parseSalePriceTargetKey('TIER:tier-1')).toEqual({ kind: 'TIER', id: 'tier-1' });
    expect(parseSalePriceTargetKey('nope')).toBeNull();
  });
});

describe('gradationsFromCatalog', () => {
  it('offers every gradation in the catalog, including ones never priced yet', () => {
    expect(
      gradationsFromCatalog([
        {
          title: 'Мультиязычность',
          tiers: [
            { id: 'tier-site', label: 'Лендинг' },
            { id: 'tier-system', label: 'CRM, ERP' },
          ],
        },
        { title: 'Оплата Idram' },
      ]),
    ).toEqual([
      { id: 'tier-site', label: 'Мультиязычность · Лендинг' },
      { id: 'tier-system', label: 'Мультиязычность · CRM, ERP' },
    ]);
  });

  it('finds none when no card is sold at several volumes', () => {
    expect(gradationsFromCatalog([{ title: 'Оплата Idram', tiers: [] }])).toEqual([]);
  });
});
