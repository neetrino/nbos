import { describe, expect, it } from 'vitest';
import {
  formatCredentialTypeLabel,
  isLegacyCredentialType,
  LEGACY_CREDENTIAL_TYPE,
} from './credential-type-display';

describe('credential-type-display', () => {
  it('detects legacy type', () => {
    expect(isLegacyCredentialType(LEGACY_CREDENTIAL_TYPE)).toBe(true);
    expect(isLegacyCredentialType('API_KEY')).toBe(false);
  });

  it('formats known types', () => {
    expect(formatCredentialTypeLabel('API_KEY')).toBe('API key / Token');
  });
});
