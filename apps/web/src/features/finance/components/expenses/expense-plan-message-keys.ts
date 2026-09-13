import { useTranslations } from 'next-intl';
import type { ExpensePlanGridCellKind } from '@/lib/api/expense-plans';

/** Parent registers the `expensePlans` namespace after this slice. */
export function useExpensePlansT() {
  return useTranslations('expensePlans');
}

export type ExpensePlansTranslate = ReturnType<typeof useExpensePlansT>;

const FREQUENCY_KEYS = {
  ONE_TIME: 'frequency.ONE_TIME',
  WEEKLY: 'frequency.WEEKLY',
  MONTHLY: 'frequency.MONTHLY',
  QUARTERLY: 'frequency.QUARTERLY',
  YEARLY: 'frequency.YEARLY',
  MULTI_YEAR: 'frequency.MULTI_YEAR',
  OTHER: 'frequency.OTHER',
} as const;

const STATUS_KEYS = {
  ACTIVE: 'status.ACTIVE',
  CANCELLED: 'status.CANCELLED',
} as const;

const CATEGORY_KEYS = {
  DOMAIN: 'category.DOMAIN',
  TOOLS: 'category.TOOLS',
  MARKETING: 'category.MARKETING',
  OFFICE: 'category.OFFICE',
  TAXES: 'category.TAXES',
  PARTNER_PAYOUT: 'category.PARTNER_PAYOUT',
  OTHER: 'category.OTHER',
  SALARY: 'category.SALARY',
  BONUS: 'category.BONUS',
} as const;

const CELL_KEYS = {
  PAID: 'grid.cell.PAID',
  PARTIAL: 'grid.cell.PARTIAL',
  OVERDUE: 'grid.cell.OVERDUE',
  OPEN: 'grid.cell.OPEN',
  FORECAST: 'grid.cell.FORECAST',
} as const;

function lookupKey(map: Record<string, string>, value: string | undefined): string | null {
  if (!value) return null;
  return map[value] ?? null;
}

export function expensePlanFrequencyMessageKey(value: string): string {
  return lookupKey(FREQUENCY_KEYS, value) ?? FREQUENCY_KEYS.OTHER;
}

export function expensePlanStatusMessageKey(value: string | undefined): string | null {
  return lookupKey(STATUS_KEYS, value);
}

export function expensePlanCategoryMessageKey(value: string): string | null {
  return lookupKey(CATEGORY_KEYS, value);
}

export function expensePlanCellStatusMessageKey(kind: ExpensePlanGridCellKind): string | null {
  if (kind === 'NA') return null;
  return lookupKey(CELL_KEYS, kind);
}

export function translateExpensePlanFrequency(t: ExpensePlansTranslate, value: string): string {
  return t(expensePlanFrequencyMessageKey(value) as never);
}

export function translateExpensePlanStatus(
  t: ExpensePlansTranslate,
  value: string | undefined,
  fallback: string,
): string {
  const key = expensePlanStatusMessageKey(value);
  return key ? t(key as never) : fallback;
}

export function translateExpensePlanCategory(
  t: ExpensePlansTranslate,
  value: string,
  fallback: string,
): string {
  const key = expensePlanCategoryMessageKey(value);
  return key ? t(key as never) : fallback;
}

export function translateExpensePlanCellStatus(
  t: ExpensePlansTranslate,
  kind: ExpensePlanGridCellKind,
): string {
  const key = expensePlanCellStatusMessageKey(kind);
  return key ? t(key as never) : '';
}

export const EXPENSE_PLAN_FREQUENCY_VALUES = Object.keys(FREQUENCY_KEYS);
export const EXPENSE_PLAN_STATUS_VALUES = Object.keys(STATUS_KEYS);
export const EXPENSE_PLAN_CATEGORY_VALUES = Object.keys(CATEGORY_KEYS);
