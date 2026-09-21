import { describe, expect, it } from 'vitest';
import { CatalogContentValidationError } from './catalog-write';
import {
  parseSalePriceBody,
  resolveSalePrice,
  salePriceTargetKey,
  sumSalePrices,
} from './sale-price';

describe('salePriceTargetKey', () => {
  it('separates a function, one of its gradations and a product core', () => {
    expect(salePriceTargetKey({ kind: 'FUNCTION', functionId: 'fn-1' })).toBe('FUNCTION:fn-1');
    expect(salePriceTargetKey({ kind: 'TIER', tierId: 'fn-1' })).toBe('TIER:fn-1');
    expect(salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: 'fn-1' })).toBe('CORE:fn-1');
  });
});

describe('resolveSalePrice', () => {
  it('sells a blog core of 100 units at 5 000 AMD each for 500 000', () => {
    expect(resolveSalePrice({ units: '100', amountPerUnit: '5000' })).toEqual({
      amount: '500000.00',
      source: 'CARD',
    });
  });

  it('does not invent a price when the card has no stored rate', () => {
    expect(resolveSalePrice({ units: '30', amountPerUnit: null })).toEqual({
      amount: null,
      source: 'UNKNOWN',
    });
  });

  it('reports an unknown price rather than inventing one without units', () => {
    expect(resolveSalePrice({ units: null, amountPerUnit: '5000' })).toEqual({
      amount: null,
      source: 'UNKNOWN',
    });
  });
});

describe('sumSalePrices', () => {
  it('adds what is known', () => {
    expect(sumSalePrices(['300000.00', '120000.50'])).toBe('420000.50');
  });

  it('refuses to report a total that hides an unknown item', () => {
    expect(sumSalePrices(['300000.00', null])).toBeNull();
  });
});

describe('parseSalePriceBody', () => {
  const target = { kind: 'FUNCTION', functionId: 'fn-1' } as const;

  it('accepts a positive AMD-per-unit rate', () => {
    expect(
      parseSalePriceBody({ amountPerUnit: '5000', effectiveFrom: '2026-10-01' }, target),
    ).toMatchObject({ amountPerUnit: '5000.0000' });
  });

  it('refuses a version with no rate', () => {
    expect(() => parseSalePriceBody({ effectiveFrom: '2026-10-01' }, target)).toThrow(
      /amountPerUnit is required/,
    );
  });

  it('refuses zero and negative rates', () => {
    expect(() =>
      parseSalePriceBody({ amountPerUnit: '0', effectiveFrom: '2026-10-01' }, target),
    ).toThrow(/greater than zero/);
  });

  it('requires a date the version takes effect from', () => {
    expect(() => parseSalePriceBody({ amountPerUnit: '10000' }, target)).toThrow(
      CatalogContentValidationError,
    );
  });
});
