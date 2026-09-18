import { describe, expect, it } from 'vitest';
import { buildExpensePlanListWhere } from './expense-plan-query.where';

describe('buildExpensePlanListWhere', () => {
  it('adds frequency when the value is a known cadence', () => {
    expect(buildExpensePlanListWhere({ frequency: 'MONTHLY' })).toEqual({
      frequency: 'MONTHLY',
    });
  });

  it('drops unknown frequency values', () => {
    expect(buildExpensePlanListWhere({ frequency: 'CUSTOM' })).toEqual({});
  });
});
