import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DEFAULT_SALE_MULTIPLIER } from '@nbos/shared';
import type { CatalogRateRow, CatalogSalePriceRow } from './function-catalog-sale-price';
import {
  functionTargetKey,
  loadDeveloperRateIfPermitted,
  pickDeveloperRate,
  pickSalePriceVersion,
  sumSelectionSalePrices,
  visibleSalePrice,
  visibleSalePriceByFunctionId,
} from './function-catalog-sale-price';

function version(
  overrides: Partial<CatalogSalePriceRow> & Pick<CatalogSalePriceRow, 'targetKey'>,
): CatalogSalePriceRow {
  return {
    version: 1,
    status: 'PUBLISHED',
    multiplier: null,
    fixedAmount: null,
    ...overrides,
  };
}

const RATE = '1000';

describe('pickSalePriceVersion', () => {
  const target = functionTargetKey('fn-1');

  it('prefers the newest published version over a later draft', () => {
    const chosen = pickSalePriceVersion(
      [
        version({ targetKey: target, version: 1, status: 'PUBLISHED', fixedAmount: '100' }),
        version({ targetKey: target, version: 2, status: 'DRAFT', fixedAmount: '200' }),
      ],
      true,
    );
    expect(chosen?.version).toBe(1);
    expect(chosen?.status).toBe('PUBLISHED');
  });

  it('falls back to the newest draft only when rules permission is granted', () => {
    const drafts = [
      version({ targetKey: target, version: 1, status: 'DRAFT', fixedAmount: '100' }),
      version({ targetKey: target, version: 3, status: 'DRAFT', fixedAmount: '300' }),
    ];
    expect(pickSalePriceVersion(drafts, true)?.version).toBe(3);
    expect(pickSalePriceVersion(drafts, false)).toBeUndefined();
  });
});

describe('visibleSalePrice permission rule', () => {
  const target = functionTargetKey('fn-1');

  it('shows a published fixed amount to a viewer without the rules permission', () => {
    expect(
      visibleSalePrice({
        canViewRules: false,
        versions: [version({ targetKey: target, fixedAmount: '400000' })],
        units: '30',
        developerRate: RATE,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: '400000.00', unpublished: false });
  });

  it('shows no computed price without the rules permission', () => {
    expect(
      visibleSalePrice({
        canViewRules: false,
        versions: [version({ targetKey: target, multiplier: '10' })],
        units: '30',
        developerRate: RATE,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toBeUndefined();
  });

  it('ignores units and the rate without the rules permission even when they are passed', () => {
    expect(
      visibleSalePrice({
        canViewRules: false,
        versions: [version({ targetKey: target, multiplier: '10', fixedAmount: null })],
        units: '999',
        developerRate: RATE,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toBeUndefined();
  });

  it('computes from units and the rate when rules permission is granted', () => {
    expect(
      visibleSalePrice({
        canViewRules: true,
        versions: [version({ targetKey: target, multiplier: '10' })],
        units: '30',
        developerRate: RATE,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: '300000.00', unpublished: false });
  });

  it('marks a draft fallback as not yet published', () => {
    expect(
      visibleSalePrice({
        canViewRules: true,
        versions: [version({ targetKey: target, status: 'DRAFT', fixedAmount: '150000' })],
        units: null,
        developerRate: null,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      }),
    ).toEqual({ amount: '150000.00', unpublished: true });
  });
});

describe('sumSelectionSalePrices', () => {
  it('sums known prices of a selection', () => {
    expect(
      sumSelectionSalePrices([
        { amount: '300000.00', unpublished: false },
        { amount: '120000.50', unpublished: false },
      ]),
    ).toBe('420000.50');
  });

  it('refuses a total when any selected item has no visible price', () => {
    expect(
      sumSelectionSalePrices([{ amount: '300000.00', unpublished: false }, undefined]),
    ).toBeNull();
  });
});

describe('visibleSalePriceByFunctionId', () => {
  it('indexes a visible price by function id from FUNCTION target keys', () => {
    const prices = visibleSalePriceByFunctionId(
      ['fn-1', 'fn-2'],
      [
        version({ targetKey: functionTargetKey('fn-1'), fixedAmount: '100000' }),
        version({ targetKey: functionTargetKey('fn-2'), multiplier: '10' }),
      ],
      {
        canViewRules: false,
        unitsByFunctionId: new Map([['fn-2', 30]]),
        developerRate: RATE,
        defaultMultiplier: DEFAULT_SALE_MULTIPLIER,
      },
    );
    expect(prices.get('fn-1')?.amount).toBe('100000.00');
    expect(prices.has('fn-2')).toBe(false);
  });
});

describe('loadDeveloperRateIfPermitted', () => {
  const rate = (overrides: Partial<CatalogRateRow> = {}): CatalogRateRow => ({
    roleKey: 'BACKEND',
    version: 1,
    status: 'PUBLISHED',
    rate: RATE,
    ...overrides,
  });

  it('does not load rates without rules permission', async () => {
    const loadRates = vi.fn(async () => [rate()]);
    await expect(loadDeveloperRateIfPermitted(false, loadRates)).resolves.toBeUndefined();
    expect(loadRates).not.toHaveBeenCalled();
  });

  it('picks the newest published backend rate when permitted', async () => {
    const loadRates = vi.fn(async () => [
      rate({ version: 1, rate: '800' }),
      rate({ version: 2, rate: '1200' }),
      rate({ roleKey: 'QA', rate: '500' }),
    ]);
    await expect(loadDeveloperRateIfPermitted(true, loadRates)).resolves.toBe('1200');
  });
});

describe('pickDeveloperRate', () => {
  it('falls back to a draft backend rate when nothing is published', () => {
    expect(
      pickDeveloperRate([
        { roleKey: 'BACKEND', version: 2, status: 'DRAFT', rate: '900' },
        { roleKey: 'BACKEND', version: 1, status: 'DRAFT', rate: '700' },
      ]),
    ).toBe('900');
  });
});

describe('sale price confidential values stay off the card', () => {
  it('card and blocks only receive a display label, never units or a rate', () => {
    const root = path.join(process.cwd(), 'apps/web/src/features/function-catalog');
    const card = readFileSync(path.join(root, 'function-catalog-card.tsx'), 'utf8');
    const blocks = readFileSync(path.join(root, 'function-catalog-blocks.tsx'), 'utf8');
    for (const source of [card, blocks]) {
      expect(source).not.toContain('developerRate');
      expect(source).not.toContain('listRoleRates');
      expect(source).not.toContain('roleUnits');
      expect(source).not.toContain('listFunctionPrices');
      expect(source).not.toContain('resolveSalePrice');
    }
    expect(card).toContain('salePriceLabel');
  });
});
