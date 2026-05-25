import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { computeSalesKpiBurnedAmount } from './sales-kpi-burned-amount';

describe('computeSalesKpiBurnedAmount', () => {
  it('returns null for non-SALES types', () => {
    expect(
      computeSalesKpiBurnedAmount({
        releaseAmount: new Decimal(100),
        kpiScaledAmount: new Decimal(50),
        bonusType: 'DELIVERY',
      }),
    ).toBeNull();
  });

  it('returns null when included equals release', () => {
    expect(
      computeSalesKpiBurnedAmount({
        releaseAmount: new Decimal(100),
        kpiScaledAmount: new Decimal(100),
        bonusType: 'SALES',
      }),
    ).toBeNull();
  });

  it('returns release minus included for SALES', () => {
    expect(
      computeSalesKpiBurnedAmount({
        releaseAmount: new Decimal(100),
        kpiScaledAmount: new Decimal(50),
        bonusType: 'SALES',
      })?.toString(),
    ).toBe('50');
  });
});
