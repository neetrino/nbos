import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { computeUnitEconomicsMoney } from './compute-unit-economics-money';

describe('computeUnitEconomicsMoney', () => {
  it('computes cash balance from received minus factual outflows', () => {
    const result = computeUnitEconomicsMoney({
      invoiced: new Decimal('1000'),
      received: new Decimal('600'),
      receivable: new Decimal('400'),
      expensesPaid: new Decimal('150'),
      pool: {
        planned: new Decimal('300'),
        released: new Decimal('100'),
        paid: new Decimal('50'),
        remaining: new Decimal('250'),
      },
    });

    expect(result.cashBalance).toBe('450.00');
    expect(result.outFactAmount).toBe('150.00');
    expect(result.outCommittedAmount).toBe('400.00');
    expect(result.marginAfterCommitments).toBe('200.00');
    expect(result.overReleaseAmount).toBe('0.00');
  });

  it('flags over-release when released bonuses exceed received', () => {
    const result = computeUnitEconomicsMoney({
      invoiced: new Decimal('100'),
      received: new Decimal('50'),
      receivable: new Decimal('50'),
      expensesPaid: new Decimal('0'),
      pool: {
        planned: new Decimal('80'),
        released: new Decimal('70'),
        paid: new Decimal('0'),
        remaining: new Decimal('80'),
      },
    });

    expect(result.overReleaseAmount).toBe('20.00');
  });
});
