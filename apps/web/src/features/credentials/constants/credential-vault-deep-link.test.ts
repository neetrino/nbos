import { describe, expect, it } from 'vitest';
import {
  CREDENTIAL_VAULT_OPEN_QUERY,
  buildCredentialVaultHref,
} from './credential-vault-deep-link';

describe('credential-vault-deep-link', () => {
  it('builds vault href with openCredentialId query', () => {
    const href = buildCredentialVaultHref('cred-1');
    expect(href).toBe(`/credentials?${CREDENTIAL_VAULT_OPEN_QUERY}=cred-1`);
  });
});
