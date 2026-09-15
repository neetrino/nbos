import { describe, expect, it } from 'vitest';
import {
  applyExpensePlanToCreateForm,
  buildCreateExpensePayload,
  type CreateExpenseFormState,
  type ExpenseCreateLinkedPlan,
} from './expense-create-defaults';

const PLAN: ExpenseCreateLinkedPlan = {
  id: 'plan-1',
  name: 'Water',
  category: 'OFFICE',
  productId: 'prod-1',
  credentialId: 'cred-1',
};

function form(overrides: Partial<CreateExpenseFormState> = {}): CreateExpenseFormState {
  return {
    name: '',
    amount: '10000',
    dueDate: '2026-04-12',
    expensePlanId: '',
    ...overrides,
  };
}

describe('applyExpensePlanToCreateForm', () => {
  it('fills an empty name from the selected plan', () => {
    const next = applyExpensePlanToCreateForm(form(), null, PLAN);
    expect(next.expensePlanId).toBe('plan-1');
    expect(next.name).toBe('Water');
  });

  it('keeps a custom name when switching plans', () => {
    const next = applyExpensePlanToCreateForm(form({ name: 'Bottles' }), PLAN, {
      ...PLAN,
      id: 'plan-2',
      name: 'Office',
    });
    expect(next.name).toBe('Bottles');
    expect(next.expensePlanId).toBe('plan-2');
  });
});

describe('buildCreateExpensePayload', () => {
  it('omits plan fields when no plan is linked', () => {
    const payload = buildCreateExpensePayload(form({ name: 'Ad hoc' }), {});
    expect(payload?.expensePlanId).toBeNull();
    expect(payload?.category).toBe('OTHER');
    expect(payload?.credentialId).toBeNull();
  });

  it('copies category, product, and credential from the linked plan', () => {
    const payload = buildCreateExpensePayload(form({ name: 'Water', expensePlanId: 'plan-1' }), {
      linkedPlan: PLAN,
    });
    expect(payload).toMatchObject({
      expensePlanId: 'plan-1',
      category: 'OFFICE',
      productId: 'prod-1',
      credentialId: 'cred-1',
    });
  });
});
