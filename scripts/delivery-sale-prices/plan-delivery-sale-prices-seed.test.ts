import { describe, expect, it } from 'vitest';
import type { ResolvedSalePriceTarget } from './build-sale-price-targets';
import { saleAmountForUnits } from './sale-price-seed-amounts';
import {
  formatSalePriceSeedPlan,
  planDeliverySalePricesSeed,
} from './plan-delivery-sale-prices-seed';

const pay: ResolvedSalePriceTarget = {
  code: 'PAY_IDRAM',
  amountPerUnit: saleAmountForUnits(16),
  functionCode: 'PAY_IDRAM',
  tierCode: null,
  targetKey: 'FUNCTION:fn-pay',
  functionId: 'fn-pay',
  tierId: null,
};

const ai: ResolvedSalePriceTarget = {
  code: 'AI_SUPPORT_CHATBOT',
  amountPerUnit: saleAmountForUnits(40),
  functionCode: 'AI_SUPPORT_CHATBOT',
  tierCode: null,
  targetKey: 'FUNCTION:fn-ai',
  functionId: 'fn-ai',
  tierId: null,
};

describe('planDeliverySalePricesSeed', () => {
  it('prices a card at 5 000 AMD per seeded unit', () => {
    expect(saleAmountForUnits(10)).toBe('50000');
    expect(saleAmountForUnits(20)).toBe('100000');
    const plan = planDeliverySalePricesSeed([pay, ai], []);
    expect(plan.createCount).toBe(2);
    expect(plan.entries[0]).toMatchObject({ action: 'CREATE', item: pay });
  });

  it('updates a flat seed amount and keeps a matching one', () => {
    const plan = planDeliverySalePricesSeed(
      [pay, ai],
      [
        { targetKey: pay.targetKey, amountPerUnit: '10000.0000' },
        { targetKey: ai.targetKey, amountPerUnit: ai.amountPerUnit },
      ],
    );
    expect(plan.updateCount).toBe(1);
    expect(plan.keepCount).toBe(1);
    expect(plan.entries[0]?.action).toBe('UPDATE');
    expect(plan.entries[1]?.action).toBe('KEEP');
  });

  it('marks a dry run in the printed plan', () => {
    const plan = planDeliverySalePricesSeed([pay], []);
    expect(formatSalePriceSeedPlan(plan, false)).toContain('Dry run');
    expect(formatSalePriceSeedPlan(plan, true)).toContain('Applying');
  });
});
