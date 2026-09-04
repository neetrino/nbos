import { BadRequestException } from '@nestjs/common';
import { coerceExpenseCategoryToCanonical } from './expense-category-canonical';
import {
  pickExpenseBacklogReasonFilter,
  pickExpenseCategoryFilter,
  pickExpenseFrequencyFilter,
  pickExpenseStatusFilter,
  pickExpenseTypeFilter,
  pickTaxStatusFilter,
} from './expense-query-enum-guards';

const INVALID = {
  backlogReason: 'Invalid expense backlog reason',
  category: 'Invalid expense category',
  frequency: 'Invalid expense frequency',
  status: 'Invalid expense status',
  taxStatus: 'Invalid tax status',
  type: 'Invalid expense type',
} as const;

export function requireExpenseType(value: string): string {
  const v = pickExpenseTypeFilter(value);
  if (!v) throw new BadRequestException(INVALID.type);
  return v;
}

/** Accepts canonical or legacy category; returns consolidated enum value. */
export function requireExpenseCategory(value: string): string {
  const raw = pickExpenseCategoryFilter(value);
  if (!raw) throw new BadRequestException(INVALID.category);
  const canonical = coerceExpenseCategoryToCanonical(raw);
  if (canonical) return canonical;
  if (raw === 'SALARY' || raw === 'BONUS') return raw;
  throw new BadRequestException(INVALID.category);
}

const EXPENSE_PLAN_BLOCKED_CATEGORIES = new Set(['SALARY', 'BONUS']);

/** Plan categories exclude payroll automation enums. Partner Payout is selectable. */
export function requireExpensePlanCategory(value: string): string {
  const v = requireExpenseCategory(value);
  if (EXPENSE_PLAN_BLOCKED_CATEGORIES.has(v)) {
    throw new BadRequestException('Salary and Bonus are not valid expense plan categories');
  }
  return v;
}

export function resolveExpenseFrequency(value: string | undefined): string {
  return pickExpenseFrequencyFilter(value) ?? 'ONE_TIME';
}

export function resolveExpenseStatus(value: string | undefined): string {
  return pickExpenseStatusFilter(value) ?? 'PLANNED';
}

export function resolveExpenseTaxStatus(value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return 'TAX';
  const v = pickTaxStatusFilter(value);
  if (!v) throw new BadRequestException(INVALID.taxStatus);
  return v;
}

export function requireExpenseTypeIfPresent(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireExpenseType(value);
}

export function requireExpenseCategoryIfPresent(
  value: string | undefined | null,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireExpenseCategory(value);
}

export function requireExpenseFrequencyIfPresent(
  value: string | undefined | null,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  const v = pickExpenseFrequencyFilter(value);
  if (!v) throw new BadRequestException(INVALID.frequency);
  return v;
}

export function requireExpenseStatusIfPresent(
  value: string | undefined | null,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  const v = pickExpenseStatusFilter(value);
  if (!v) throw new BadRequestException(INVALID.status);
  return v;
}

export function requireTaxStatusIfPresent(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const v = pickTaxStatusFilter(value);
  if (!v) throw new BadRequestException(INVALID.taxStatus);
  return v;
}

/** Undefined skips field; null clears optional backlog reason; otherwise validates enum. */
export function parseExpenseBacklogReasonField(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = pickExpenseBacklogReasonFilter(value);
  if (!v) throw new BadRequestException(INVALID.backlogReason);
  return v;
}
