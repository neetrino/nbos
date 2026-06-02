import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import type { CredentialVaultListScope } from '@/features/credentials/constants/credential-vault-page-state-storage';
import type { CredentialVaultSavedView } from '@/features/credentials/constants/credential-vault-saved-view.types';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export const CREDENTIAL_VAULT_SAVED_VIEWS_KEY = 'nbos:credentials:vault-saved-views';
export const CREDENTIAL_VAULT_SAVED_VIEWS_MAX = 15;
export const CREDENTIAL_VAULT_SAVED_VIEWS_CHANGE = 'nbos:credentials:vault-saved-views-change';

const VALID_TABS = new Set<CredentialVaultScope>(['all', 'my', 'team', 'project', 'secret']);
const VALID_LIST_SCOPES = new Set<CredentialVaultListScope>(['active', 'archived']);
const VALID_VIEW_MODES = new Set<CredentialVaultViewMode>(['list', 'tiles', 'category-board']);
const VALID_QUICK = new Set<CredentialQuickFilterKey>(['mine', 'needsRotation']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function parseFilters(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string') out[key] = raw;
  }
  return out;
}

function parseView(raw: unknown): CredentialVaultSavedView | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const name = raw.name;
  const createdAt = raw.createdAt;
  const activeTab = raw.activeTab;
  const vaultListScope = raw.vaultListScope;
  const viewMode = raw.viewMode;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof createdAt !== 'string') {
    return null;
  }
  if (typeof activeTab !== 'string' || !VALID_TABS.has(activeTab as CredentialVaultScope)) {
    return null;
  }
  if (
    typeof vaultListScope !== 'string' ||
    !VALID_LIST_SCOPES.has(vaultListScope as CredentialVaultListScope)
  ) {
    return null;
  }
  if (typeof viewMode !== 'string' || !VALID_VIEW_MODES.has(viewMode as CredentialVaultViewMode)) {
    return null;
  }
  const quickFiltersRaw = raw.quickFilters;
  const quickFilters: CredentialQuickFilterKey[] = Array.isArray(quickFiltersRaw)
    ? quickFiltersRaw.filter(
        (item): item is CredentialQuickFilterKey =>
          typeof item === 'string' && VALID_QUICK.has(item as CredentialQuickFilterKey),
      )
    : [];

  return {
    id,
    name: name.trim(),
    createdAt,
    activeTab: activeTab as CredentialVaultScope,
    vaultListScope: vaultListScope as CredentialVaultListScope,
    viewMode: viewMode as CredentialVaultViewMode,
    search: typeof raw.search === 'string' ? raw.search : '',
    filters: parseFilters(raw.filters),
    quickCategory: typeof raw.quickCategory === 'string' ? raw.quickCategory : null,
    quickFilters,
  };
}

export function readCredentialVaultSavedViews(): CredentialVaultSavedView[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(CREDENTIAL_VAULT_SAVED_VIEWS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => parseView(item))
      .filter((item): item is CredentialVaultSavedView => item !== null && item.name.length > 0);
  } catch {
    return [];
  }
}

export function writeCredentialVaultSavedViews(views: CredentialVaultSavedView[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    CREDENTIAL_VAULT_SAVED_VIEWS_KEY,
    JSON.stringify(views.slice(0, CREDENTIAL_VAULT_SAVED_VIEWS_MAX)),
  );
  window.dispatchEvent(new Event(CREDENTIAL_VAULT_SAVED_VIEWS_CHANGE));
}
