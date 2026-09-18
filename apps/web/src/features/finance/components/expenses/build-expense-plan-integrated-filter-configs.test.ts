import { describe, expect, it } from 'vitest';
import { EXPENSE_PLAN_PERIOD_FILTER_KEY } from '@/features/finance/constants/expense-plan-period-filter';
import { buildExpensePlanIntegratedFilterConfigs } from './build-expense-plan-integrated-filter-configs';

describe('buildExpensePlanIntegratedFilterConfigs', () => {
  it('puts Period first like other finance lists', () => {
    const configs = buildExpensePlanIntegratedFilterConfigs([]);
    expect(configs[0]?.key).toBe(EXPENSE_PLAN_PERIOD_FILTER_KEY);
  });
});
