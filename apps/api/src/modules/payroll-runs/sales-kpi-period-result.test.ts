import { describe, expect, it } from 'vitest';

import { pickUniqueEmployeePeriodKpiResult } from './sales-kpi-period-result';

describe('pickUniqueEmployeePeriodKpiResult', () => {
  it('returns the only row', () => {
    expect(pickUniqueEmployeePeriodKpiResult([{ id: 'kr1' }])).toEqual({ id: 'kr1' });
  });

  it('returns null when missing or ambiguous (no row-order pick)', () => {
    expect(pickUniqueEmployeePeriodKpiResult([])).toBeNull();
    expect(pickUniqueEmployeePeriodKpiResult([{ id: 'a' }, { id: 'b' }])).toBeNull();
  });
});
