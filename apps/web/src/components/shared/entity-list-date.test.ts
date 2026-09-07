import { describe, expect, it } from 'vitest';
import { formatEntityListDate, resolveEntityListDateParts } from './entity-list-date';

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
