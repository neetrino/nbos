import { describe, expect, it } from 'vitest';
import {
  CREATE_EXPENSE_PLAN_NONE,
  buildPlanOptions,
  filterPlanOptions,
} from './create-expense-dialog-plan-options';

describe('create-expense-dialog-plan-options', () => {
  const options = buildPlanOptions(
    [
      { id: 'plan-ios', name: '10xmarket.am IOS Account' },
      { id: 'plan-hosting', name: '10xmarket.am | Neetrino Hosting' },
    ],
    'No plan',
  );

  it('puts the none option first', () => {
    expect(options[0]).toEqual({ value: CREATE_EXPENSE_PLAN_NONE, label: 'No plan' });
    expect(options).toHaveLength(3);
  });

  it('filters by plan name without changing the none option when query is empty', () => {
    expect(filterPlanOptions(options, '  ')).toEqual(options);
    expect(filterPlanOptions(options, 'neetrino').map((option) => option.value)).toEqual([
      'plan-hosting',
    ]);
  });
});
