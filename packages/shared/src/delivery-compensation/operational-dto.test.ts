import { describe, expect, it } from 'vitest';
import { assertNoFinancialLeak, omitFinancialFields } from './operational-dto';

describe('delivery compensation operational DTO', () => {
  it('strips units, rates and private snapshots', () => {
    const safe = omitFinancialFields({
      id: 'fn-1',
      title: 'Bank payment',
      units: '10',
      rate: '1000',
      deliveryNormativeSnapshot: { units: 10 },
    });
    expect(safe).toEqual({ id: 'fn-1', title: 'Bank payment' });
    expect(assertNoFinancialLeak(safe)).toEqual([]);
  });

  it('finds nested financial leaks', () => {
    expect(
      assertNoFinancialLeak({
        function: { title: 'Warehouse', price: { units: '10' } },
      }),
    ).toEqual(['root.function.price.units']);
  });
});
