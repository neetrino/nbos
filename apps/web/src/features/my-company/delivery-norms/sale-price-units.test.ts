import { describe, expect, it } from 'vitest';
import { saleUnitTotals, type SaleFunctionUnitRow } from './sale-price-units';

const ROLES = [
  { unitKind: 'REQUIRED' as const, units: '60' },
  { unitKind: 'REQUIRED' as const, units: '55' },
  { unitKind: 'NOT_REQUIRED' as const, units: null },
];

describe('saleUnitTotals', () => {
  it('sums a core version and ignores roles that do not pay', () => {
    const totals = saleUnitTotals('CORE', [], [{ id: 'core-1', roleUnits: ROLES }]);
    expect(totals.get('CORE:core-1')).toBe('115');
  });

  it('shows the function draft ahead of the published vector', () => {
    const prices: SaleFunctionUnitRow[] = [
      { status: 'PUBLISHED', functionId: 'fn-1', tierId: null, roleUnits: ROLES },
      {
        status: 'DRAFT',
        functionId: 'fn-1',
        tierId: null,
        roleUnits: [{ unitKind: 'REQUIRED', units: '10' }],
      },
    ];
    expect(saleUnitTotals('FUNCTION', prices, []).get('FUNCTION:fn-1')).toBe('10');
  });

  it('keeps a gradation total on its own row and skips an empty vector', () => {
    const prices: SaleFunctionUnitRow[] = [
      { status: 'PUBLISHED', functionId: 'fn-1', tierId: 'tier-1', roleUnits: ROLES },
      { status: 'PUBLISHED', functionId: 'fn-1', tierId: null, roleUnits: [] },
    ];
    const totals = saleUnitTotals('TIER', prices, []);
    expect(totals.get('TIER:tier-1')).toBe('115');
    expect(saleUnitTotals('FUNCTION', prices, []).get('FUNCTION:fn-1')).toBe('—');
  });
});
