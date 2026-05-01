import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  parseExpenseBacklogReasonField,
  requireExpenseCategory,
  requireExpenseType,
  resolveExpenseTaxStatus,
} from './expense-mutation-enum-validators';

describe('expense-mutation-enum-validators', () => {
  it('requireExpenseType throws on invalid value', () => {
    expect(() => requireExpenseType('X')).toThrow(BadRequestException);
  });

  it('requireExpenseCategory throws on invalid value', () => {
    expect(() => requireExpenseCategory('NOT_CAT')).toThrow(BadRequestException);
  });

  it('resolveExpenseTaxStatus defaults and validates', () => {
    expect(resolveExpenseTaxStatus(undefined)).toBe('TAX');
    expect(resolveExpenseTaxStatus(null)).toBe('TAX');
    expect(() => resolveExpenseTaxStatus('NOPE')).toThrow(BadRequestException);
  });

  it('parseExpenseBacklogReasonField handles undefined, null, and invalid', () => {
    expect(parseExpenseBacklogReasonField(undefined)).toBeUndefined();
    expect(parseExpenseBacklogReasonField(null)).toBeNull();
    expect(parseExpenseBacklogReasonField('WAITING_CLIENT')).toBe('WAITING_CLIENT');
    expect(() => parseExpenseBacklogReasonField('BAD')).toThrow(BadRequestException);
  });
});
