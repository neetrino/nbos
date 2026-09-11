import type { ExpensePlan } from '@/lib/api/expense-plans';

export type ExpensePlanFormState = {
  name: string;
  amount: string;
  category: string;
  frequency: string;
  nextDueDate: string;
  productId: string;
  credentialId: string;
  autoGenerate: boolean;
  notes: string;
};

export const EMPTY_EXPENSE_PLAN_FORM: ExpensePlanFormState = {
  name: '',
  amount: '',
  category: 'OTHER',
  frequency: 'ONE_TIME',
  nextDueDate: '',
  productId: '',
  credentialId: '',
  autoGenerate: false,
  notes: '',
};

function optionalId(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

/** Maps API plan to dialog fields (`nextDueDate` as `YYYY-MM-DD` for `<input type="date">`). */
export function expensePlanToFormState(plan: ExpensePlan): ExpensePlanFormState {
  return {
    name: plan.name,
    amount: String(plan.amount).trim(),
    category: plan.category,
    frequency: plan.frequency,
    nextDueDate: plan.nextDueDate ? plan.nextDueDate.slice(0, 10) : '',
    productId: optionalId(plan.productId),
    credentialId: optionalId(plan.credentialId),
    autoGenerate: plan.autoGenerate,
    notes: plan.notes ?? '',
  };
}
