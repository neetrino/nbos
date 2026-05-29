import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { computeAutoPayable, computePayableAmount } from './bonus-payable-snapshot';

describe('bonus payable snapshot math', () => {
  it('computes auto payable from amount and factor', () => {
    expect(computeAutoPayable(new Decimal(100_000), new Decimal('0.7')).toString()).toBe('70000');
  });

  it('adds manual adjustment to auto payable', () => {
    expect(computePayableAmount(new Decimal(70_000), new Decimal(20_000)).toString()).toBe('90000');
  });

  it('clamps payable to zero when adjustment is deeply negative', () => {
    expect(computePayableAmount(new Decimal(10_000), new Decimal(-50_000)).isZero()).toBe(true);
  });
});
