import {
  ExpenseBacklogReasonEnum,
  ExpenseCategoryEnum,
  ExpenseFrequency,
  ExpenseStatusEnum,
  ExpenseTypeEnum,
  TaxStatus,
} from '@nbos/database';

function pickEnumMember(
  allowed: ReadonlySet<string>,
  value: string | undefined | null,
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return allowed.has(value) ? value : undefined;
}

const EXPENSE_TYPE_SET = new Set<string>(Object.values(ExpenseTypeEnum));
const EXPENSE_CATEGORY_SET = new Set<string>(Object.values(ExpenseCategoryEnum));
const EXPENSE_FREQUENCY_SET = new Set<string>(Object.values(ExpenseFrequency));
const EXPENSE_STATUS_SET = new Set<string>(Object.values(ExpenseStatusEnum));
const TAX_STATUS_SET = new Set<string>(Object.values(TaxStatus));
const EXPENSE_BACKLOG_REASON_SET = new Set<string>(Object.values(ExpenseBacklogReasonEnum));

/** Drops unknown values so Prisma never receives invalid enum strings from query params. */
export function pickExpenseTypeFilter(value: string | undefined | null): string | undefined {
  return pickEnumMember(EXPENSE_TYPE_SET, value);
}

export function pickExpenseCategoryFilter(value: string | undefined | null): string | undefined {
  return pickEnumMember(EXPENSE_CATEGORY_SET, value);
}

export function pickExpenseFrequencyFilter(value: string | undefined | null): string | undefined {
  return pickEnumMember(EXPENSE_FREQUENCY_SET, value);
}

export function pickExpenseStatusFilter(value: string | undefined | null): string | undefined {
  return pickEnumMember(EXPENSE_STATUS_SET, value);
}

export function pickTaxStatusFilter(value: string | undefined | null): string | undefined {
  return pickEnumMember(TAX_STATUS_SET, value);
}

export function pickExpenseBacklogReasonFilter(
  value: string | undefined | null,
): string | undefined {
  return pickEnumMember(EXPENSE_BACKLOG_REASON_SET, value);
}
