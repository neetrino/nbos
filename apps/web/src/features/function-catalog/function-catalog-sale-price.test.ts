import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CatalogSalePriceRow } from './function-catalog-sale-price';
import {
  functionTargetKey,
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
    resolvedAmount: '300000.00',
    ...overrides,
  };
}

describe('pickSalePriceVersion', () => {
  const target = functionTargetKey('fn-1');

  it('prefers the newest published version over a later draft', () => {
    const chosen = pickSalePriceVersion(
      [
        version({ targetKey: target, version: 1, status: 'PUBLISHED', resolvedAmount: '100.00' }),
        version({ targetKey: target, version: 2, status: 'DRAFT', resolvedAmount: '200.00' }),
      ],
      true,
    );
    expect(chosen?.version).toBe(1);
    expect(chosen?.status).toBe('PUBLISHED');
  });

  it('falls back to the newest draft only when rules permission is granted', () => {
    const drafts = [
      version({ targetKey: target, version: 1, status: 'DRAFT', resolvedAmount: '100.00' }),
      version({ targetKey: target, version: 3, status: 'DRAFT', resolvedAmount: '300.00' }),
    ];
    expect(pickSalePriceVersion(drafts, true)?.version).toBe(3);
    expect(pickSalePriceVersion(drafts, false)).toBeUndefined();
  });
});

describe('visibleSalePrice', () => {
  const target = functionTargetKey('fn-1');

  it('shows a published client amount to a viewer without the rules permission', () => {
    expect(
      visibleSalePrice({
        canViewRules: false,
        versions: [version({ targetKey: target, resolvedAmount: '400000.00' })],
      }),
    ).toEqual({ amount: '400000.00', unpublished: false });
  });

  it('hides a draft unless the viewer may see unpublished norms', () => {
    expect(
      visibleSalePrice({
        canViewRules: false,
        versions: [version({ targetKey: target, status: 'DRAFT', resolvedAmount: '150000.00' })],
      }),
    ).toBeUndefined();
  });

  it('marks a draft fallback as not yet published', () => {
    expect(
      visibleSalePrice({
        canViewRules: true,
        versions: [version({ targetKey: target, status: 'DRAFT', resolvedAmount: '150000.00' })],
      }),
    ).toEqual({ amount: '150000.00', unpublished: true });
  });

  it('shows nothing when the server could not resolve a line amount', () => {
    expect(
      visibleSalePrice({
        canViewRules: true,
        versions: [version({ targetKey: target, resolvedAmount: null })],
      }),
    ).toBeUndefined();
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
        version({ targetKey: functionTargetKey('fn-1'), resolvedAmount: '100000.00' }),
        version({ targetKey: functionTargetKey('fn-2'), resolvedAmount: '300000.00' }),
      ],
      false,
    );
    expect(prices.get('fn-1')?.amount).toBe('100000.00');
    expect(prices.get('fn-2')?.amount).toBe('300000.00');
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
