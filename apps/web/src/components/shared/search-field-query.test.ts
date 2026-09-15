import { describe, expect, it } from 'vitest';
import { searchFieldTypeDelayMs, SEARCH_FIELD_TYPE_DEBOUNCE_MS } from './search-field-query';

describe('searchFieldTypeDelayMs', () => {
  it('runs empty open/clear immediately', () => {
    expect(searchFieldTypeDelayMs('')).toBe(0);
    expect(searchFieldTypeDelayMs('   ')).toBe(0);
  });

  it('debounces typed queries', () => {
    expect(searchFieldTypeDelayMs('aws')).toBe(SEARCH_FIELD_TYPE_DEBOUNCE_MS);
  });
});
