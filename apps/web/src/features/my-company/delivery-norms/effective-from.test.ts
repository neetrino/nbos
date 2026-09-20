import { describe, expect, it } from 'vitest';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';

describe('effective-from helpers', () => {
  it('takes a calendar date from the local clock', () => {
    const now = new Date(2026, 8, 20, 15, 4, 0);
    expect(todayDateInputValue(now)).toBe('2026-09-20');
  });

  it('emits midnight UTC for a valid date input', () => {
    expect(dateInputToIso('2026-09-20')).toBe('2026-09-20T00:00:00.000Z');
    expect(isValidDateInput('2026-09-20')).toBe(true);
  });

  it('rejects empty or short values', () => {
    expect(dateInputToIso('')).toBe('');
    expect(isValidDateInput('')).toBe(false);
    expect(isValidDateInput('2026-9-2')).toBe(false);
  });
});
