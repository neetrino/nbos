import { describe, expect, it } from 'vitest';
import { formatCredentialTypeLabel } from './credential-type-display';

describe('formatCredentialTypeLabel', () => {
  it('formats known types', () => {
    expect(formatCredentialTypeLabel('API_KEY')).toBe('API key / Token');
  });

  it('falls back to underscored label', () => {
    expect(formatCredentialTypeLabel('CUSTOM_TYPE')).toBe('CUSTOM TYPE');
  });
});
