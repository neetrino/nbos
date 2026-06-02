import { describe, it, expect } from 'vitest';
import { normalizeCredentialListSort } from './credential-list-sort';

describe('normalizeCredentialListSort', () => {
  it('defaults active vault to recent', () => {
    expect(normalizeCredentialListSort(undefined, false)).toBe('recent');
  });

  it('forces archived lists to created_desc', () => {
    expect(normalizeCredentialListSort('recent', true)).toBe('created_desc');
  });

  it('accepts name sort', () => {
    expect(normalizeCredentialListSort('name_asc', false)).toBe('name_asc');
  });
});
