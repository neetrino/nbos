import { describe, expect, it } from 'vitest';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import {
  buildSalePriceFormInput,
  parsePositiveDecimal,
  parseSalePriceTargetKey,
  salePricesForTarget,
  targetKeyForKind,
  gradationsFromCatalog,
  tierIdsFromSalePrices,
  groupSalePricesByKind,
} from './sale-price-draft';

describe('parsePositiveDecimal', () => {
  it('accepts a positive number and rejects zero, negatives and blank', () => {
    expect(parsePositiveDecimal('10000')).toBe('10000');
    expect(parsePositiveDecimal(' 7.5 ')).toBe('7.5');
    expect(parsePositiveDecimal('0')).toBeNull();
    expect(parsePositiveDecimal('-5')).toBeNull();
    expect(parsePositiveDecimal('')).toBeNull();
  });
});

describe('buildSalePriceFormInput', () => {
  it('requires an AMD-per-unit rate', () => {
    expect(buildSalePriceFormInput({ amountPerUnit: '', effectiveFrom: '2026-10-01' })).toEqual({
      ok: false,
      error: 'priceRequired',
    });
  });

  it('rejects zero and negative values', () => {
    expect(buildSalePriceFormInput({ amountPerUnit: '0', effectiveFrom: '2026-10-01' })).toEqual({
      ok: false,
      error: 'notPositive',
    });
    expect(buildSalePriceFormInput({ amountPerUnit: '-1', effectiveFrom: '2026-10-01' })).toEqual({
      ok: false,
      error: 'notPositive',
    });
  });

  it('accepts a positive AMD-per-unit rate', () => {
    expect(buildSalePriceFormInput({ amountPerUnit: '5000', effectiveFrom: '2026-10-01' })).toEqual(
      {
        ok: true,
        input: { amountPerUnit: '5000', effectiveFrom: '2026-10-01T00:00:00.000Z' },
      },
    );
  });
});

describe('sale price target keys', () => {
  it('builds and parses function, tier and core keys', () => {
    expect(targetKeyForKind('FUNCTION', 'fn-1')).toBe('FUNCTION:fn-1');
    expect(targetKeyForKind('TIER', 'tier-1')).toBe('TIER:tier-1');
    expect(targetKeyForKind('CORE', 'core-1')).toBe('CORE:core-1');
    expect(parseSalePriceTargetKey('TIER:tier-1')).toEqual({ kind: 'TIER', id: 'tier-1' });
    expect(parseSalePriceTargetKey('nope')).toBeNull();
  });
});

describe('salePricesForTarget and tierIdsFromSalePrices', () => {
  const rows: SalePriceVersionDto[] = [
    saleRow('FUNCTION:fn-1', 1),
    saleRow('TIER:tier-a', 2),
    saleRow('TIER:tier-a', 1),
    saleRow('TIER:tier-b', 1),
  ];

  it('filters and sorts versions of one target', () => {
    expect(salePricesForTarget(rows, 'TIER:tier-a').map((row) => row.version)).toEqual([2, 1]);
    expect(salePricesForTarget(rows, null)).toEqual([]);
  });

  it('collects unique gradation ids', () => {
    expect(tierIdsFromSalePrices(rows)).toEqual(['tier-a', 'tier-b']);
  });
});

function saleRow(targetKey: string, version: number): SalePriceVersionDto {
  return {
    id: `${targetKey}-${version}`,
    targetKey,
    version,
    status: 'DRAFT',
    effectiveFrom: '2026-10-01T00:00:00.000Z',
    amountPerUnit: '10000',
    resolvedAmount: '300000.00',
    currency: 'AMD',
  };
}

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

describe('groupSalePricesByKind', () => {
  it('keeps function, gradation and core groups in that order', () => {
    const grouped = groupSalePricesByKind([
      saleRow('CORE:c1', 1),
      saleRow('FUNCTION:f1', 2),
      saleRow('FUNCTION:f1', 1),
      saleRow('TIER:t1', 1),
    ]);
    expect(grouped.map((group) => group.kind)).toEqual(['FUNCTION', 'TIER', 'CORE']);
    expect(grouped[0]?.groups[0]?.rows.map((row) => row.version)).toEqual([2, 1]);
  });
});
