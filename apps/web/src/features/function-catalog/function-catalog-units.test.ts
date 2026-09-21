import { describe, expect, it, vi } from 'vitest';
import type { CatalogPriceRow } from './function-catalog-units';
import {
  buildUnitsByFunctionId,
  loadCatalogUnitsIfPermitted,
  pickFunctionPriceVersion,
  sumFunctionRoleUnits,
  visibleUnitsTotal,
} from './function-catalog-units';

function price(
  overrides: Partial<CatalogPriceRow> & Pick<CatalogPriceRow, 'functionId'>,
): CatalogPriceRow {
  return {
    version: 1,
    status: 'PUBLISHED',
    roleUnits: [
      { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '10' },
      { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '5' },
    ],
    ...overrides,
  };
}

describe('visibleUnitsTotal', () => {
  it('produces no units value without rules permission', () => {
    expect(visibleUnitsTotal(false, 12)).toBeUndefined();
    expect(visibleUnitsTotal(false, 0)).toBeUndefined();
    expect(visibleUnitsTotal(false, undefined)).toBeUndefined();
  });

  it('passes through the total when rules permission is granted', () => {
    expect(visibleUnitsTotal(true, 12)).toBe(12);
    expect(visibleUnitsTotal(true, 0)).toBe(0);
    expect(visibleUnitsTotal(true, undefined)).toBeUndefined();
  });
});

describe('loadCatalogUnitsIfPermitted', () => {
  it('does not load prices and returns no map without rules permission', async () => {
    const loadPrices = vi.fn(async () => [price({ functionId: 'fn-1' })]);
    await expect(loadCatalogUnitsIfPermitted(false, loadPrices)).resolves.toBeUndefined();
    expect(loadPrices).not.toHaveBeenCalled();
  });

  it('loads prices and returns totals when rules permission is granted', async () => {
    const loadPrices = vi.fn(async () => [price({ functionId: 'fn-1' })]);
    const totals = await loadCatalogUnitsIfPermitted(true, loadPrices);
    expect(loadPrices).toHaveBeenCalledOnce();
    expect(totals?.get('fn-1')).toBe(15);
  });
});

describe('pickFunctionPriceVersion', () => {
  it('prefers the newest published version over a later draft', () => {
    const chosen = pickFunctionPriceVersion([
      price({ functionId: 'fn', version: 1, status: 'PUBLISHED', roleUnits: [] }),
      price({ functionId: 'fn', version: 2, status: 'DRAFT', roleUnits: [] }),
    ]);
    expect(chosen?.version).toBe(1);
    expect(chosen?.status).toBe('PUBLISHED');
  });

  it('falls back to the newest draft when nothing is published', () => {
    const chosen = pickFunctionPriceVersion([
      price({ functionId: 'fn', version: 1, status: 'DRAFT', roleUnits: [] }),
      price({ functionId: 'fn', version: 3, status: 'DRAFT', roleUnits: [] }),
      price({ functionId: 'fn', version: 2, status: 'ARCHIVED', roleUnits: [] }),
    ]);
    expect(chosen?.version).toBe(3);
  });
});

describe('sumFunctionRoleUnits', () => {
  it('sums required role units and skips unused roles', () => {
    expect(
      sumFunctionRoleUnits(
        price({
          functionId: 'fn',
          roleUnits: [
            { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '4' },
            { roleKey: 'QA', unitKind: 'NOT_REQUIRED', units: null },
            { roleKey: 'PM', unitKind: 'REQUIRED', units: '0' },
          ],
        }),
      ),
    ).toBe(4);
  });

  it('returns nothing when no numeric units exist', () => {
    expect(
      sumFunctionRoleUnits(
        price({
          functionId: 'fn',
          roleUnits: [{ roleKey: 'BACKEND', unitKind: 'NOT_REQUIRED', units: null }],
        }),
      ),
    ).toBeUndefined();
  });
});

describe('buildUnitsByFunctionId', () => {
  it('keeps one total per function from the chosen version', () => {
    const totals = buildUnitsByFunctionId([
      price({
        functionId: 'a',
        version: 1,
        roleUnits: [{ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '1' }],
      }),
      price({
        functionId: 'a',
        version: 2,
        status: 'PUBLISHED',
        roleUnits: [{ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '9' }],
      }),
      price({
        functionId: 'b',
        status: 'DRAFT',
        roleUnits: [{ roleKey: 'QA', unitKind: 'REQUIRED', units: '3' }],
      }),
    ]);
    expect(totals.get('a')).toBe(9);
    expect(totals.get('b')).toBe(3);
  });
});
