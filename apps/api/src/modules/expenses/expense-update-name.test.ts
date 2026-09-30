import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  expenseUpdateBookedAt,
  isExpenseNameOnlyPatch,
  resolveExpenseNamePatch,
} from './expense-update-name';

describe('expense update name', () => {
  it('treats a lone name as a label-only patch', () => {
    expect(isExpenseNameOnlyPatch({ name: 'Office rent' })).toBe(true);
    expect(isExpenseNameOnlyPatch({ name: 'Office rent', amount: 10 })).toBe(false);
    expect(isExpenseNameOnlyPatch({ notes: 'later' })).toBe(false);
    expect(isExpenseNameOnlyPatch({})).toBe(false);
  });

  it('uses the stored due date when the patch does not send one', () => {
    const stored = new Date('2026-04-10T00:00:00.000Z');
    expect(expenseUpdateBookedAt(undefined, stored)).toBe(stored);
    expect(expenseUpdateBookedAt('2026-05-01T00:00:00.000Z', stored).toISOString()).toBe(
      '2026-05-01T00:00:00.000Z',
    );
  });

  it('trims a name and rejects a blank one', () => {
    expect(resolveExpenseNamePatch(undefined)).toBeUndefined();
    expect(resolveExpenseNamePatch('  Office rent  ')).toBe('Office rent');
    expect(() => resolveExpenseNamePatch('   ')).toThrow(BadRequestException);
  });
});
