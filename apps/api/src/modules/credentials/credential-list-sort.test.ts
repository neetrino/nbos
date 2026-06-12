import { describe, it, expect } from 'vitest';
import { normalizeCredentialListSort } from './credential-list-sort';

describe('normalizeCredentialListSort', () => {
  it('defaults active vault to recent', () => {
    expect(normalizeCredentialListSort(undefined, false)).toBe('recent');
  });

  it('forces trash lists to created_desc when sort is recent', () => {
    expect(normalizeCredentialListSort('recent', true)).toBe('created_desc');
  });

  it('accepts name sort for active vault', () => {
    expect(normalizeCredentialListSort('name_asc', false)).toBe('name_asc');
  });

  it('accepts name sort for trash lists', () => {
    expect(normalizeCredentialListSort('name_asc', true)).toBe('name_asc');
  });
});
