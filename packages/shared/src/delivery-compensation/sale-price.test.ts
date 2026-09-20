import { describe, expect, it } from 'vitest';
import { CatalogContentValidationError } from './catalog-write';
import {
  DEFAULT_SALE_MULTIPLIER,
  parseSalePriceBody,
  resolveSalePrice,
  salePriceTargetKey,
  sumSalePrices,
} from './sale-price';

const RATE = '1000';

describe('salePriceTargetKey', () => {
  it('separates a function, one of its gradations and a product core', () => {
    expect(salePriceTargetKey({ kind: 'FUNCTION', functionId: 'fn-1' })).toBe('FUNCTION:fn-1');
    expect(salePriceTargetKey({ kind: 'TIER', tierId: 'fn-1' })).toBe('TIER:fn-1');
    expect(salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: 'fn-1' })).toBe('CORE:fn-1');
  });
});

describe('resolveSalePrice', () => {
  it('sells units at the global multiplier when the card carries no price', () => {
    expect(
      resolveSalePrice({
        units: '30',
        developerRate: RATE,
        multiplier: null,
        fixedAmount: null,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: '300000.00', source: 'DEFAULT_MULTIPLIER' });
  });

  it('uses the multiplier of the card when it has one', () => {
    expect(
      resolveSalePrice({
        units: '30',
        developerRate: RATE,
        multiplier: '20',
        fixedAmount: null,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: '600000.00', source: 'MULTIPLIER' });
  });

  it('lets a fixed market price win over any multiplier', () => {
    expect(
      resolveSalePrice({
        units: '100',
        developerRate: RATE,
        multiplier: '10',
        fixedAmount: '400000',
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: '400000.00', source: 'FIXED' });
  });

  it('reports an unknown price rather than inventing one without units or a rate', () => {
    expect(
      resolveSalePrice({
        units: null,
        developerRate: RATE,
        multiplier: '10',
        fixedAmount: null,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: null, source: 'UNKNOWN' });
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

  it('accepts a multiplier alone', () => {
    expect(
      parseSalePriceBody({ multiplier: '7.5', effectiveFrom: '2026-10-01' }, target),
    ).toMatchObject({ multiplier: '7.5000', fixedAmount: null });
  });

  it('accepts a fixed amount alone', () => {
    expect(
      parseSalePriceBody({ fixedAmount: 400000, effectiveFrom: '2026-10-01' }, target),
    ).toMatchObject({ multiplier: null, fixedAmount: '400000.00' });
  });

  it('refuses a version with no price at all', () => {
    expect(() => parseSalePriceBody({ effectiveFrom: '2026-10-01' }, target)).toThrow(
      /multiplier or a fixed sale amount/,
    );
  });

  it('refuses zero and negative prices', () => {
    expect(() =>
      parseSalePriceBody({ multiplier: '0', effectiveFrom: '2026-10-01' }, target),
    ).toThrow(/greater than zero/);
    expect(() =>
      parseSalePriceBody({ fixedAmount: '-5', effectiveFrom: '2026-10-01' }, target),
    ).toThrow(/greater than zero/);
  });

  it('requires a date the version takes effect from', () => {
    expect(() => parseSalePriceBody({ multiplier: '10' }, target)).toThrow(
      CatalogContentValidationError,
    );
  });
});
