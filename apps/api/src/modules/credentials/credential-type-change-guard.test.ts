import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { assertCredentialTypeChangeAllowed } from './credential-type-change-guard';

describe('assertCredentialTypeChangeAllowed', () => {
  const existing = {
    credentialType: 'SSH_PRIVATE_KEY',
    password: 'enc',
    passphrase: null,
    apiKey: null,
    envData: null,
    secureNotes: null,
  };

  it('allows same-lane change without acknowledgement', () => {
    expect(() =>
      assertCredentialTypeChangeAllowed(existing, { credentialType: 'LOGIN_PASSWORD' }),
    ).not.toThrow();
  });

  it('blocks cross-lane change with orphaned password', () => {
    expect(() =>
      assertCredentialTypeChangeAllowed(existing, { credentialType: 'API_KEY' }),
    ).toThrow(BadRequestException);
  });

  it('allows cross-lane change when client acknowledges', () => {
    expect(() =>
      assertCredentialTypeChangeAllowed(existing, {
        credentialType: 'API_KEY',
        acknowledgeOrphanedSecrets: true,
      }),
    ).not.toThrow();
  });
});
