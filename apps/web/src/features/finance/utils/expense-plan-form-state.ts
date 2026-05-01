import type { ExpensePlan } from '@/lib/api/expense-plans';

export type ExpensePlanFormState = {
  name: string;
  amount: string;
  category: string;
  frequency: string;
  nextDueDate: string;
  provider: string;
  projectId: string;
  autoGenerate: boolean;
  notes: string;
};

export const EMPTY_EXPENSE_PLAN_FORM: ExpensePlanFormState = {
  name: '',
  amount: '',
  category: 'OTHER',
  frequency: 'ONE_TIME',
  nextDueDate: '',
  provider: '',
  projectId: 'none',
  autoGenerate: false,
  notes: '',
};

/** Maps API plan to dialog fields (`nextDueDate` as `YYYY-MM-DD` for `<input type="date">`). */
export function expensePlanToFormState(plan: ExpensePlan): ExpensePlanFormState {
  return {
    name: plan.name,
    amount: String(plan.amount).trim(),
    category: plan.category,
    frequency: plan.frequency,
    nextDueDate: plan.nextDueDate ? plan.nextDueDate.slice(0, 10) : '',
    provider: plan.provider ?? '',
    projectId: plan.projectId ?? 'none',
    autoGenerate: plan.autoGenerate,
    notes: plan.notes ?? '',
  };
}
