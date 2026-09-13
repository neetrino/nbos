import type enExpenses from '@/messages/en/expenses.json';
import type { MessageLeafKeys } from '@/i18n/message-leaf-keys';
import { coerceExpenseCategoryToCanonical } from '@/features/finance/constants/expense-category-canonical';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STAGES,
  EXPENSE_SYSTEM_CATEGORIES,
} from '@/features/finance/constants/finance';
import {
  EXPENSE_BACKLOG_REASONS,
  EXPENSE_FREQUENCIES,
  EXPENSE_TYPES,
  TAX_STATUSES,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ExpenseLedgerPaymentStatus } from '@/lib/api/finance';

/** Dotted keys of `messages/{locale}/expenses.json`. */
export type ExpensesMessageKey = MessageLeafKeys<typeof enExpenses>;

export type ExpensesTranslator = (key: ExpensesMessageKey) => string;

const STAGE_VALUES = new Set<string>(EXPENSE_STAGES.map((item) => item.value));
const CATEGORY_VALUES = new Set<string>(
  [...EXPENSE_CATEGORIES, ...EXPENSE_SYSTEM_CATEGORIES].map((item) => item.value),
);
const TYPE_VALUES = new Set<string>(EXPENSE_TYPES.map((item) => item.value));
const FREQUENCY_VALUES = new Set<string>(EXPENSE_FREQUENCIES.map((item) => item.value));
const TAX_VALUES = new Set<string>(TAX_STATUSES.map((item) => item.value));
const BACKLOG_REASON_VALUES = new Set<string>(EXPENSE_BACKLOG_REASONS.map((item) => item.value));
const STAGE_SHORT_VALUES = new Set([
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
  'ON_HOLD',
  'PAID',
  'CANCELLED',
]);

function translateKnown(
  value: string,
  allowed: ReadonlySet<string>,
  prefix: 'stage' | 'stageShort' | 'category' | 'type' | 'frequency' | 'tax' | 'backlogReason',
  t: ExpensesTranslator,
  fallback: string,
): string {
  if (!allowed.has(value)) {
    return fallback;
  }
  return t(`${prefix}.${value}` as ExpensesMessageKey);
}

/** Board / filter / badge label for an expense workflow status VALUE. */
export function translateExpenseStage(value: string, t: ExpensesTranslator): string {
  const fallback = EXPENSE_STAGES.find((item) => item.value === value)?.label ?? value;
  return translateKnown(value, STAGE_VALUES, 'stage', t, fallback);
}

/** Sheet pipeline short label; keeps status VALUES. */
export function translateExpenseStageShort(value: string, t: ExpensesTranslator): string {
  return translateKnown(value, STAGE_SHORT_VALUES, 'stageShort', t, value);
}

/** Category enum label at render; unknown / user values stay as-is. */
export function translateExpenseCategory(value: string, t: ExpensesTranslator): string {
  const canonical = coerceExpenseCategoryToCanonical(value) ?? value;
  const fallback =
    [...EXPENSE_CATEGORIES, ...EXPENSE_SYSTEM_CATEGORIES].find((item) => item.value === canonical)
      ?.label ?? value;
  return translateKnown(canonical, CATEGORY_VALUES, 'category', t, fallback);
}

export function translateExpenseType(value: string, t: ExpensesTranslator): string {
  const fallback = EXPENSE_TYPES.find((item) => item.value === value)?.label ?? value;
  return translateKnown(value, TYPE_VALUES, 'type', t, fallback);
}

export function translateExpenseFrequency(value: string, t: ExpensesTranslator): string {
  const fallback = EXPENSE_FREQUENCIES.find((item) => item.value === value)?.label ?? value;
  return translateKnown(value, FREQUENCY_VALUES, 'frequency', t, fallback);
}

export function translateExpenseTaxStatus(value: string, t: ExpensesTranslator): string {
  const fallback = TAX_STATUSES.find((item) => item.value === value)?.label ?? value;
  return translateKnown(value, TAX_VALUES, 'tax', t, fallback);
}

export function translateExpenseBacklogReason(
  value: string | null | undefined,
  t: ExpensesTranslator,
): string {
  if (!value || value === 'none') {
    return t('backlogReason.none');
  }
  const fallback = EXPENSE_BACKLOG_REASONS.find((item) => item.value === value)?.label ?? value;
  return translateKnown(value, BACKLOG_REASON_VALUES, 'backlogReason', t, fallback);
}

export function buildExpenseSelectOptions(
  catalog: ReadonlyArray<{ value: string }>,
  currentValue: string,
  translate: (value: string) => string,
): Array<{ value: string; label: string }> {
  const items = catalog.map((item) => ({
    value: item.value,
    label: translate(item.value),
  }));
  if (!items.some((item) => item.value === currentValue)) {
    items.push({ value: currentValue, label: translate(currentValue) });
  }
  return items;
}

export function translateExpensePaymentStatus(
  status: ExpenseLedgerPaymentStatus,
  t: ExpensesTranslator,
): string {
  if (status === 'PAID') return t('paymentStatus.PAID');
  if (status === 'PARTIAL') return t('paymentStatus.PARTIAL');
  return t('paymentStatus.UNPAID');
}
