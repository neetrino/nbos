import { parseExpenseDraftAmount } from '@/features/finance/utils/expense-general-form-state';
import type { CreateExpensePayload } from '@/lib/api/finance';

export interface CreateExpenseFormState {
  name: string;
  amount: string;
  dueDate: string;
}

/** Server defaults for fields collected in the expense detail sheet after create. */
export const EXPENSE_CREATE_HIDDEN_DEFAULTS = {
  type: 'PLANNED',
  category: 'OTHER',
  frequency: 'ONE_TIME',
  status: 'PLANNED',
  isPassThrough: false,
  taxStatus: 'TAX',
} as const;

export function buildCreateExpensePayload(
  form: CreateExpenseFormState,
  options: {
    defaultProjectId?: string | null;
    defaultStatus?: string;
  },
): CreateExpensePayload | null {
  const amount = parseExpenseDraftAmount(form.amount);
  const name = form.name.trim();
  if (!name || amount == null) return null;

  const status = options.defaultStatus ?? EXPENSE_CREATE_HIDDEN_DEFAULTS.status;

  return {
    name,
    amount,
    type: EXPENSE_CREATE_HIDDEN_DEFAULTS.type,
    category: EXPENSE_CREATE_HIDDEN_DEFAULTS.category,
    frequency: EXPENSE_CREATE_HIDDEN_DEFAULTS.frequency,
    status,
    dueDate: form.dueDate.trim() ? form.dueDate : null,
    projectId:
      options.defaultProjectId && options.defaultProjectId.length > 0
        ? options.defaultProjectId
        : null,
    isPassThrough: EXPENSE_CREATE_HIDDEN_DEFAULTS.isPassThrough,
    taxStatus: EXPENSE_CREATE_HIDDEN_DEFAULTS.taxStatus,
    notes: null,
    ...(status === 'BACKLOG' ? { backlogReason: null } : {}),
  };
}
