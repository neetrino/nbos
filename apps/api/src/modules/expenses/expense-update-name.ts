import { BadRequestException } from '@nestjs/common';
import type { UpdateExpenseDto } from './expense-service.types';

/**
 * A label-only patch does not post to the ledger, so a closed posting period
 * must not block it. Any other defined field still goes through the period guard.
 */
export function isExpenseNameOnlyPatch(data: UpdateExpenseDto): boolean {
  const defined = (Object.keys(data) as Array<keyof UpdateExpenseDto>).filter(
    (key) => data[key] !== undefined,
  );
  return defined.length === 1 && defined[0] === 'name';
}

/** Due date for the posting-period guard: the incoming date, otherwise the stored one. */
export function expenseUpdateBookedAt(
  dueDate: string | null | undefined,
  existingDue: Date | null,
): Date {
  if (dueDate === undefined) return existingDue ?? new Date();
  return dueDate ? new Date(dueDate) : new Date();
}

/** Trims a provided name and rejects an empty one. Undefined means "leave unchanged". */
export function resolveExpenseNamePatch(name: string | undefined): string | undefined {
  if (name === undefined) return undefined;
  const trimmed = name.trim();
  if (!trimmed) throw new BadRequestException('Name cannot be empty');
  return trimmed;
}
