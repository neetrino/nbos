import { describe, expect, it } from 'vitest';
import { buildCredentialVaultPreview } from '@/features/credentials/utils/credential-vault-preview';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

function base(overrides: Partial<CredentialListItem> = {}): CredentialListItem {
  return {
    id: 'c1',
    name: 'Test',
    category: 'ADMIN',
    credentialType: 'LOGIN_PASSWORD',
    criticality: 'LOW',
    provider: null,
    url: null,
    login: null,
    phone: null,
    accessLevel: 'SECRET',
    allowedEmployees: [],
    project: null,
    department: null,
    owner: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    secretsPresent: {
      password: false,
      passphrase: false,
      apiKey: false,
      envData: false,
      secureNotes: false,
    },
    ...overrides,
  };
}

describe('buildCredentialVaultPreview', () => {
  it('shows ENV info only', () => {
    const model = buildCredentialVaultPreview(
      base({
        credentialType: 'ENV_BUNDLE',
        secretsPresent: { ...base().secretsPresent!, envData: true },
      }),
    );
    expect(model.infoOnly).toBe(true);
    expect(model.items).toEqual([{ type: 'info', icon: 'braces', label: 'ENV' }]);
  });

  it('shows SSH info when username or key is missing', () => {
    expect(
      buildCredentialVaultPreview(base({ credentialType: 'SSH_PRIVATE_KEY', login: 'deploy' }))
        .infoOnly,
    ).toBe(true);
  });

  it('shows SSH copy actions when username and key are present', () => {
    const model = buildCredentialVaultPreview(
      base({
        credentialType: 'SSH_PRIVATE_KEY',
        login: 'deploy',
        secretsPresent: { ...base().secretsPresent!, password: true },
      }),
    );
    expect(model.infoOnly).toBe(false);
    expect(model.items).toHaveLength(2);
  });

  it('shows API key badge and copy secret on separate rows', () => {
    const model = buildCredentialVaultPreview(
      base({
        credentialType: 'API_KEY',
        secretsPresent: { ...base().secretsPresent!, apiKey: true },
      }),
    );
    expect(model.infoOnly).toBe(false);
    expect(model.items.map((item) => item.type)).toEqual(['info', 'copy-secret']);
  });

  it('shows App Store account and password copy', () => {
    const model = buildCredentialVaultPreview(
      base({
        credentialType: 'APP_STORE_ACCOUNT',
        login: 'dev@icloud.com',
        appStorePlatform: 'APPLE',
        secretsPresent: { ...base().secretsPresent!, password: true },
      }),
    );
    expect(model.items.map((item) => item.type)).toEqual(['copy-text', 'copy-secret']);
  });
});
