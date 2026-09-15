import { parseExpenseDraftAmount } from '@/features/finance/utils/expense-general-form-state';
import type { CreateExpensePayload } from '@/lib/api/finance';

export interface CreateExpenseFormState {
  name: string;
  amount: string;
  dueDate: string;
  expensePlanId: string;
}

/** Fields copied onto a manual card when the user picks an expense plan. */
export type ExpenseCreateLinkedPlan = {
  id: string;
  name: string;
  category: string;
  productId: string | null;
  credentialId: string | null;
};

/** Server defaults for fields collected in the expense detail sheet after create. */
export const EXPENSE_CREATE_HIDDEN_DEFAULTS = {
  type: 'PLANNED',
  category: 'OTHER',
  frequency: 'ONE_TIME',
  status: 'PLANNED',
  isPassThrough: false,
  taxStatus: 'TAX',
} as const;

export function applyExpensePlanToCreateForm(
  form: CreateExpenseFormState,
  previousPlan: ExpenseCreateLinkedPlan | null,
  nextPlan: ExpenseCreateLinkedPlan | null,
): CreateExpenseFormState {
  const nameMatchesPrevious = previousPlan != null && form.name.trim() === previousPlan.name;
  const shouldReplaceName = !form.name.trim() || nameMatchesPrevious;
  return {
    ...form,
    expensePlanId: nextPlan?.id ?? '',
    name: nextPlan && shouldReplaceName ? nextPlan.name : form.name,
  };
}

export function buildCreateExpensePayload(
  form: CreateExpenseFormState,
  options: {
    defaultProductId?: string | null;
    defaultStatus?: string;
    linkedPlan?: ExpenseCreateLinkedPlan | null;
  },
): CreateExpensePayload | null {
  const amount = parseExpenseDraftAmount(form.amount);
  const name = form.name.trim();
  if (!name || amount == null) return null;

  const status = options.defaultStatus ?? EXPENSE_CREATE_HIDDEN_DEFAULTS.status;
  const plan = options.linkedPlan;
  const productId = plan?.productId || options.defaultProductId || null;

  return {
    name,
    amount,
    type: EXPENSE_CREATE_HIDDEN_DEFAULTS.type,
    category: plan?.category ?? EXPENSE_CREATE_HIDDEN_DEFAULTS.category,
    frequency: EXPENSE_CREATE_HIDDEN_DEFAULTS.frequency,
    status,
    dueDate: form.dueDate.trim() ? form.dueDate : null,
    productId: productId && productId.length > 0 ? productId : null,
    credentialId: plan?.credentialId ?? null,
    expensePlanId: plan?.id ?? null,
    isPassThrough: EXPENSE_CREATE_HIDDEN_DEFAULTS.isPassThrough,
    taxStatus: EXPENSE_CREATE_HIDDEN_DEFAULTS.taxStatus,
    notes: null,
    ...(status === 'BACKLOG' ? { backlogReason: null } : {}),
  };
}
