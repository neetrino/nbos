import { describe, expect, it } from 'vitest';
import {
  formatSalePriceSeedPlan,
  planDeliverySalePricesSeed,
  type SalePriceSeedFunction,
} from './plan-delivery-sale-prices-seed';
import { AI_SALE_AMOUNT_PER_UNIT, STANDARD_SALE_AMOUNT_PER_UNIT } from './sale-price-seed-amounts';

const functions: SalePriceSeedFunction[] = [
  { id: 'fn-pay', code: 'PAY_IDBANK', category: 'payments' },
  { id: 'fn-ai', code: 'AI_SUPPORT_CHATBOT', category: 'ai' },
];

describe('planDeliverySalePricesSeed', () => {
  it('prices ordinary work at 10 000 and AI at 20 000', () => {
    const plan = planDeliverySalePricesSeed(functions, []);

    expect(plan.createCount).toBe(2);
    expect(plan.keepCount).toBe(0);
    expect(plan.entries).toEqual([
      {
        action: 'CREATE',
        item: functions[0],
        amountPerUnit: STANDARD_SALE_AMOUNT_PER_UNIT,
        targetKey: 'FUNCTION:fn-pay',
      },
      {
        action: 'CREATE',
        item: functions[1],
        amountPerUnit: AI_SALE_AMOUNT_PER_UNIT,
        targetKey: 'FUNCTION:fn-ai',
      },
    ]);
  });

  it('keeps a function that already has any sale version', () => {
    const plan = planDeliverySalePricesSeed(functions, ['FUNCTION:fn-pay']);

    expect(plan.createCount).toBe(1);
    expect(plan.keepCount).toBe(1);
    expect(plan.entries[0]).toEqual({
      action: 'KEEP',
      item: functions[0],
      targetKey: 'FUNCTION:fn-pay',
    });
    expect(plan.entries[1]).toMatchObject({
      action: 'CREATE',
      amountPerUnit: AI_SALE_AMOUNT_PER_UNIT,
    });
  });

  it('is a no-op on a second run', () => {
    const plan = planDeliverySalePricesSeed(functions, ['FUNCTION:fn-pay', 'FUNCTION:fn-ai']);

    expect(plan.createCount).toBe(0);
    expect(plan.entries.every((entry) => entry.action === 'KEEP')).toBe(true);
  });

  it('marks a dry run in the printed plan', () => {
    const plan = planDeliverySalePricesSeed(functions, []);
    expect(formatSalePriceSeedPlan(plan, false)).toContain('Dry run');
    expect(formatSalePriceSeedPlan(plan, true)).toContain('Applying');
  });
});
