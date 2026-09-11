import { describe, expect, it } from 'vitest';
import type { ExpensePlan } from '../../../lib/api/expense-plans';
import { EMPTY_EXPENSE_PLAN_FORM, expensePlanToFormState } from './expense-plan-form-state';

const basePlan: ExpensePlan = {
  id: 'p1',
  name: 'Rent',
  category: 'HOSTING',
  amount: '1200.50',
  frequency: 'MONTHLY',
  nextDueDate: '2026-05-01T00:00:00.000Z',
  productId: 'prod-1',
  projectId: 'proj-1',
  credentialId: 'cred-1',
  status: 'ACTIVE',
  cancelledAt: null,
  autoGenerate: true,
  notes: 'HQ',
  createdAt: '',
  updatedAt: '',
  project: null,
  product: { id: 'prod-1', name: 'Site' },
  credential: { id: 'cred-1', name: 'Beget', login: 'ops', url: null },
  _count: { expenses: 2 },
};

describe('expensePlanToFormState', () => {
  it('maps plan fields including date slice for date input', () => {
    const form = expensePlanToFormState(basePlan);
    expect(form.name).toBe('Rent');
    expect(form.amount).toBe('1200.50');
    expect(form.category).toBe('HOSTING');
    expect(form.frequency).toBe('MONTHLY');
    expect(form.nextDueDate).toBe('2026-05-01');
    expect(form.productId).toBe('prod-1');
    expect(form.credentialId).toBe('cred-1');
    expect(form.autoGenerate).toBe(true);
    expect(form.notes).toBe('HQ');
  });

  it('uses defaults for null optional fields', () => {
    const form = expensePlanToFormState({
      ...basePlan,
      nextDueDate: null,
      productId: null,
      credentialId: null,
      notes: null,
    });
    expect(form.nextDueDate).toBe('');
    expect(form.productId).toBe('');
    expect(form.credentialId).toBe('');
    expect(form.notes).toBe('');
  });
});

describe('EMPTY_EXPENSE_PLAN_FORM', () => {
  it('has expected defaults', () => {
    expect(EMPTY_EXPENSE_PLAN_FORM.category).toBe('OTHER');
    expect(EMPTY_EXPENSE_PLAN_FORM.productId).toBe('');
    expect(EMPTY_EXPENSE_PLAN_FORM.credentialId).toBe('');
  });
});
