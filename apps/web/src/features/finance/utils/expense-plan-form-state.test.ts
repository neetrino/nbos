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
  provider: 'Landlord',
  projectId: 'proj-1',
  autoGenerate: true,
  notes: 'HQ',
  createdAt: '',
  updatedAt: '',
  project: null,
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
    expect(form.provider).toBe('Landlord');
    expect(form.projectId).toBe('proj-1');
    expect(form.autoGenerate).toBe(true);
    expect(form.notes).toBe('HQ');
  });

  it('uses defaults for null optional fields', () => {
    const form = expensePlanToFormState({
      ...basePlan,
      nextDueDate: null,
      provider: null,
      projectId: null,
      notes: null,
    });
    expect(form.nextDueDate).toBe('');
    expect(form.provider).toBe('');
    expect(form.projectId).toBe('none');
    expect(form.notes).toBe('');
  });
});

describe('EMPTY_EXPENSE_PLAN_FORM', () => {
  it('has expected defaults', () => {
    expect(EMPTY_EXPENSE_PLAN_FORM.category).toBe('OTHER');
    expect(EMPTY_EXPENSE_PLAN_FORM.projectId).toBe('none');
  });
});
