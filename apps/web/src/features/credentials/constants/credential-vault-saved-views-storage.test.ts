import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  readCredentialVaultSavedViews,
  writeCredentialVaultSavedViews,
  CREDENTIAL_VAULT_SAVED_VIEWS_KEY,
} from './credential-vault-saved-views-storage';

describe('credentialVaultSavedViewsStorage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
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
      },
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips saved views', () => {
    writeCredentialVaultSavedViews([
      {
        id: 'v1',
        name: 'Needs rotation',
        createdAt: '2026-06-02T00:00:00.000Z',
        activeTab: 'all',
        vaultListScope: 'active',
        viewMode: 'list',
        search: 'aws',
        filters: { category: 'HOSTING' },
        quickCategory: null,
        quickFilters: ['needsRotation'],
      },
    ]);
    expect(window.localStorage.getItem(CREDENTIAL_VAULT_SAVED_VIEWS_KEY)).toBeTruthy();
    expect(readCredentialVaultSavedViews()).toEqual([
      expect.objectContaining({
        id: 'v1',
        name: 'Needs rotation',
        quickFilters: ['needsRotation'],
      }),
    ]);
  });
});
