'use client';

import { createPersistedJsonStore } from '@/lib/persisted-client-state';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import {
  CREDENTIAL_VAULT_PAGED_DEFAULT_SIZE,
  normalizeCredentialVaultPageSize,
  type CredentialVaultPageSizeOption,
} from '@/features/credentials/constants/credential-vault-pagination';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export type CredentialVaultListScope = 'active' | 'trash';

export type CredentialVaultPagePreferences = {
  viewMode: CredentialVaultViewMode;
  activeTab: CredentialVaultScope;
  vaultListScope: CredentialVaultListScope;
  pageSize: CredentialVaultPageSizeOption;
};

const VALID_VIEW_MODES = new Set<CredentialVaultViewMode>([
  'list',
  'tiles',
  'category-board',
  'folders',
]);
const VALID_TABS = new Set<CredentialVaultScope>(['all', 'my', 'team', 'project', 'secret']);
const VALID_LIST_SCOPES = new Set<CredentialVaultListScope>(['active', 'trash']);

export const DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES: CredentialVaultPagePreferences = {
  viewMode: 'list',
  activeTab: 'all',
  vaultListScope: 'active',
  pageSize: CREDENTIAL_VAULT_PAGED_DEFAULT_SIZE,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function parseStoredPreferences(raw: string | null): CredentialVaultPagePreferences {
  if (!raw) {
    return DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES;
    }
    const viewMode = parsed.viewMode;
    const activeTab = parsed.activeTab;
    const rawVaultListScope = parsed.vaultListScope;
    const vaultListScope = rawVaultListScope === 'archived' ? 'trash' : rawVaultListScope;
    const pageSize = parsed.pageSize;
    return {
      viewMode:
        typeof viewMode === 'string' && VALID_VIEW_MODES.has(viewMode as CredentialVaultViewMode)
          ? (viewMode as CredentialVaultViewMode)
          : DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES.viewMode,
      activeTab:
        typeof activeTab === 'string' && VALID_TABS.has(activeTab as CredentialVaultScope)
          ? (activeTab as CredentialVaultScope)
          : DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES.activeTab,
      vaultListScope:
        typeof vaultListScope === 'string' &&
        VALID_LIST_SCOPES.has(vaultListScope as CredentialVaultListScope)
          ? (vaultListScope as CredentialVaultListScope)
          : DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES.vaultListScope,
      pageSize: normalizeCredentialVaultPageSize(
        typeof pageSize === 'number' ? pageSize : Number(pageSize),
      ),
    };
  } catch {
    return DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES;
  }
}

const credentialVaultPageStore = createPersistedJsonStore<CredentialVaultPagePreferences>({
  storageKey: 'nbos:credentials:vault-page-state',
  defaultValue: DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES,
  changeEvent: 'nbos:credentials:vault-page-state-change',
  parse: parseStoredPreferences,
});

export const readCredentialVaultPagePreferences = credentialVaultPageStore.read;
export const writeCredentialVaultPagePreferences = credentialVaultPageStore.write;
export const useCredentialVaultPagePreferences = credentialVaultPageStore.useValue;
