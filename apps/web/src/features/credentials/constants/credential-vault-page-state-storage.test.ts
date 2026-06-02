import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES,
  readCredentialVaultPagePreferences,
  writeCredentialVaultPagePreferences,
} from './credential-vault-page-state-storage';

describe('credential-vault-page-state-storage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: () => null,
      length: 0,
    };
    vi.stubGlobal('window', {
      localStorage: mockStorage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults when unset', () => {
    expect(readCredentialVaultPagePreferences()).toEqual(DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES);
  });

  it('persists view mode and tab', () => {
    writeCredentialVaultPagePreferences({ viewMode: 'tiles', activeTab: 'project' });
    expect(readCredentialVaultPagePreferences()).toEqual({
      viewMode: 'tiles',
      activeTab: 'project',
      vaultListScope: 'active',
    });
  });

  it('persists archived list scope', () => {
    writeCredentialVaultPagePreferences({ vaultListScope: 'archived' });
    expect(readCredentialVaultPagePreferences().vaultListScope).toBe('archived');
  });

  it('ignores invalid stored values', () => {
    window.localStorage.setItem(
      'nbos:credentials:vault-page-state',
      JSON.stringify({ viewMode: 'invalid', activeTab: 'bad', vaultListScope: 'unknown' }),
    );
    expect(readCredentialVaultPagePreferences()).toEqual(DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES);
  });

  it('returns a stable snapshot reference when storage is unchanged', () => {
    writeCredentialVaultPagePreferences({ viewMode: 'tiles', activeTab: 'team' });
    const first = readCredentialVaultPagePreferences();
    const second = readCredentialVaultPagePreferences();
    expect(first).toBe(second);
  });
});
