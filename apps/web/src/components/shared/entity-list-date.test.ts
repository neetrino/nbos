import { describe, expect, it } from 'vitest';
import {
  formatEntityListDate,
  resolveEntityCardDateParts,
  resolveEntityListDateParts,
} from './entity-list-date';

describe('formatEntityListDate', () => {
  it('formats a valid ISO date as dd.mm.yyyy', () => {
    expect(formatEntityListDate('2026-09-08T12:00:00.000Z')).toBe('08.09.2026');
  });

  it('returns empty string for invalid input', () => {
    expect(formatEntityListDate('not-a-date')).toBe('');
  });
});

describe('resolveEntityListDateParts', () => {
  it('splits day from month and year', () => {
    const parts = resolveEntityListDateParts('2026-09-08T12:00:00.000Z');
    expect(parts).not.toBeNull();
    expect(parts?.day).toBe('8');
    expect(parts?.monthYear).toBe('Sep 2026');
  });

  it('returns null for invalid input', () => {
    expect(resolveEntityListDateParts('not-a-date')).toBeNull();
  });
});

describe('resolveEntityCardDateParts', () => {
  it('keeps day and month together and isolates the year', () => {
    const parts = resolveEntityCardDateParts('2026-09-06T12:00:00.000Z');
    expect(parts).not.toBeNull();
    expect(parts?.dayMonth).toBe('Sep 6');
    expect(parts?.year).toBe('2026');
  });

  it('returns null for invalid input', () => {
    expect(resolveEntityCardDateParts('not-a-date')).toBeNull();
  });
});
