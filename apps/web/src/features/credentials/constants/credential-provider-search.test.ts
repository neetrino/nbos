import { describe, expect, it } from 'vitest';
import { credentialProvidersQueryKey } from './credential-provider-search';

describe('credentialProvidersQueryKey', () => {
  it('normalizes empty and typed queries', () => {
    expect(credentialProvidersQueryKey('')).toEqual(['credentials', 'providers', '']);
    expect(credentialProvidersQueryKey('  AWS ')).toEqual(['credentials', 'providers', 'AWS']);
  });
});
