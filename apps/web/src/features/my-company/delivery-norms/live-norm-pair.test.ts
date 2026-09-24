import { describe, expect, it } from 'vitest';
import { liveNormDisplayStatus, liveNormPair } from './live-norm-pair';
import { liveFunctionPrices } from './live-function-prices';
import { liveRoleRates } from './live-role-rates';
import { liveSalePrices } from './live-sale-prices';

describe('liveNormPair', () => {
  it('keeps published and draft rows of the same target apart', () => {
    const pair = liveNormPair('BACKEND', [
      { status: 'PUBLISHED', id: 'p' },
      { status: 'DRAFT', id: 'd' },
    ]);
    expect(pair.published).toEqual({ status: 'PUBLISHED', id: 'p' });
    expect(pair.draft).toEqual({ status: 'DRAFT', id: 'd' });
    expect(liveNormDisplayStatus(pair)).toBe('DRAFT');
  });
});

describe('liveRoleRates', () => {
  it('always returns six roles even when no versions exist', () => {
    expect(liveRoleRates([])).toHaveLength(6);
    expect(liveRoleRates([])[0]).toMatchObject({
      roleKey: 'BACKEND',
      published: null,
      draft: null,
    });
  });
});

describe('liveSalePrices', () => {
  it('keeps only the selected target kind', () => {
    const pairs = liveSalePrices(
      [
        {
          id: 'a',
          targetKey: 'FUNCTION:fn-1',
          version: 1,
          status: 'PUBLISHED',
          effectiveFrom: '',
          amountPerUnit: '10000',
          resolvedAmount: null,
          currency: 'AMD',
        },
        {
          id: 'b',
          targetKey: 'CORE:core-1',
          version: 1,
          status: 'DRAFT',
          effectiveFrom: '',
          amountPerUnit: '20000',
          resolvedAmount: null,
          currency: 'AMD',
        },
      ],
      'FUNCTION',
    );
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.targetKey).toBe('FUNCTION:fn-1');
  });

  it('keeps catalog items visible before they have a price', () => {
    const pairs = liveSalePrices([], 'FUNCTION', ['FUNCTION:fn-2', 'FUNCTION:fn-3']);
    expect(pairs.map((pair) => pair.targetKey)).toEqual(['FUNCTION:fn-2', 'FUNCTION:fn-3']);
    expect(pairs.every((pair) => pair.published === null && pair.draft === null)).toBe(true);
  });
});

describe('liveFunctionPrices', () => {
  it('groups a function and its gradation separately', () => {
    const pairs = liveFunctionPrices([
      {
        id: 'a',
        functionId: 'fn-1',
        tierId: null,
        version: 1,
        status: 'PUBLISHED',
        roleUnits: [],
      },
      {
        id: 'b',
        functionId: 'fn-1',
        tierId: 'tier-1',
        version: 1,
        status: 'DRAFT',
        roleUnits: [],
      },
    ]);
    expect(pairs).toHaveLength(2);
    expect(pairs.map((pair) => pair.tierId)).toEqual([null, 'tier-1']);
  });
});
