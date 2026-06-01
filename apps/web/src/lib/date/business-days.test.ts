import { describe, expect, it } from 'vitest';
import { formatIsoDateValue } from '@/components/shared/date-picker/date-picker-format';
import { getNextBusinessDay } from './business-days';

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

describe('getNextBusinessDay', () => {
  it('returns Tuesday when anchor is Monday', () => {
    const next = getNextBusinessDay(localDate(2026, 6, 1));
    expect(formatIsoDateValue(next)).toBe('2026-06-02');
  });

  it('returns Monday when anchor is Friday', () => {
    const next = getNextBusinessDay(localDate(2026, 6, 5));
    expect(formatIsoDateValue(next)).toBe('2026-06-08');
  });

  it('returns Monday when anchor is Saturday', () => {
    const next = getNextBusinessDay(localDate(2026, 6, 6));
    expect(formatIsoDateValue(next)).toBe('2026-06-08');
  });

  it('returns Monday when anchor is Sunday', () => {
    const next = getNextBusinessDay(localDate(2026, 6, 7));
    expect(formatIsoDateValue(next)).toBe('2026-06-08');
  });
});
