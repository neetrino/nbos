import { describe, it, expect } from 'vitest';
import { classifyCredentialTypeChange } from './credential-type-change-policy';

describe('classifyCredentialTypeChange', () => {
  it('allows L1 to L1', () => {
    expect(
      classifyCredentialTypeChange('LOGIN_PASSWORD', 'SSH_PRIVATE_KEY', {
        password: true,
        passphrase: false,
        apiKey: false,
        envData: false,
        secureNotes: false,
      }),
    ).toBe('green');
  });

  it('flags SSH to API_KEY when password stored', () => {
    expect(
      classifyCredentialTypeChange('SSH_PRIVATE_KEY', 'API_KEY', {
        password: true,
        passphrase: false,
        apiKey: false,
        envData: false,
        secureNotes: false,
      }),
    ).toBe('red');
  });
});
