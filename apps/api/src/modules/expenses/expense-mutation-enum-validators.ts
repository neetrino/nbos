import { BadRequestException } from '@nestjs/common';
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

export function requireExpenseCategory(value: string): string {
  const v = pickExpenseCategoryFilter(value);
  if (!v) throw new BadRequestException(INVALID.category);
  return v;
}

export function resolveExpenseFrequency(value: string | undefined): string {
  return pickExpenseFrequencyFilter(value) ?? 'ONE_TIME';
}

export function resolveExpenseStatus(value: string | undefined): string {
  return pickExpenseStatusFilter(value) ?? 'THIS_MONTH';
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
  const v = pickExpenseCategoryFilter(value);
  if (!v) throw new BadRequestException(INVALID.category);
  return v;
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
