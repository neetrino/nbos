'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import {
  CREDENTIAL_VAULT_PAGED_DEFAULT_SIZE,
  normalizeCredentialVaultPageSize,
  type CredentialVaultPageSizeOption,
} from '@/features/credentials/constants/credential-vault-pagination';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export type CredentialVaultListScope = 'active' | 'archived';

export type CredentialVaultPagePreferences = {
  viewMode: CredentialVaultViewMode;
  activeTab: CredentialVaultScope;
  vaultListScope: CredentialVaultListScope;
  pageSize: CredentialVaultPageSizeOption;
};

const STORAGE_KEY = 'nbos:credentials:vault-page-state';
const CHANGE_EVENT = 'nbos:credentials:vault-page-state-change';

const VALID_VIEW_MODES = new Set<CredentialVaultViewMode>(['list', 'tiles', 'category-board']);
const VALID_TABS = new Set<CredentialVaultScope>(['all', 'my', 'team', 'project', 'secret']);
const VALID_LIST_SCOPES = new Set<CredentialVaultListScope>(['active', 'archived']);

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
    const vaultListScope = parsed.vaultListScope;
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

let cachedPreferencesRaw: string | null | undefined;
let cachedPreferencesSnapshot: CredentialVaultPagePreferences =
  DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES;

function getCredentialVaultPagePreferencesSnapshot(): CredentialVaultPagePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedPreferencesRaw) {
    return cachedPreferencesSnapshot;
  }
  cachedPreferencesRaw = raw;
  cachedPreferencesSnapshot = parseStoredPreferences(raw);
  return cachedPreferencesSnapshot;
}

export function readCredentialVaultPagePreferences(): CredentialVaultPagePreferences {
  return getCredentialVaultPagePreferencesSnapshot();
}

export function writeCredentialVaultPagePreferences(
  partial: Partial<CredentialVaultPagePreferences>,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const next: CredentialVaultPagePreferences = {
    ...getCredentialVaultPagePreferencesSnapshot(),
    ...partial,
  };
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedPreferencesRaw = serialized;
  cachedPreferencesSnapshot = next;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribeCredentialVaultPagePreferences(onStoreChange: () => void): () => void {
  const onChange = () => onStoreChange();
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getCredentialVaultPagePreferencesServerSnapshot(): CredentialVaultPagePreferences {
  return DEFAULT_CREDENTIAL_VAULT_PAGE_PREFERENCES;
}

/** SSR-safe vault page preferences synced with localStorage after hydration. */
export function useCredentialVaultPagePreferences(): [
  CredentialVaultPagePreferences,
  (partial: Partial<CredentialVaultPagePreferences>) => void,
] {
  const preferences = useSyncExternalStore(
    subscribeCredentialVaultPagePreferences,
    getCredentialVaultPagePreferencesSnapshot,
    getCredentialVaultPagePreferencesServerSnapshot,
  );

  const setPreferences = useCallback((partial: Partial<CredentialVaultPagePreferences>) => {
    writeCredentialVaultPagePreferences(partial);
  }, []);

  return [preferences, setPreferences];
}
