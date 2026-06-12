import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';

export type CredentialVaultListSort = 'recent' | 'name_asc' | 'created_desc';

export const CREDENTIAL_VAULT_DEFAULT_SORT_ACTIVE = 'recent' as const;
export const CREDENTIAL_VAULT_DEFAULT_SORT_ARCHIVED = 'created_desc' as const;

export const CREDENTIAL_VAULT_DEFAULT_FILTER_VALUES: Record<string, string> = {
  sort: CREDENTIAL_VAULT_DEFAULT_SORT_ACTIVE,
  category: 'all',
  credentialType: 'all',
  accessLevel: 'all',
  project: 'all',
};

export function defaultCredentialVaultSortFilter(
  vaultListScope: VaultListScope,
): typeof CREDENTIAL_VAULT_DEFAULT_SORT_ACTIVE | typeof CREDENTIAL_VAULT_DEFAULT_SORT_ARCHIVED {
  return vaultListScope === 'trash'
    ? CREDENTIAL_VAULT_DEFAULT_SORT_ARCHIVED
    : CREDENTIAL_VAULT_DEFAULT_SORT_ACTIVE;
}

/** Resolves API `sort` from stored filter value (no `all`). */
export function resolveCredentialVaultListSort(
  filters: Record<string, string>,
  vaultListScope: VaultListScope,
): CredentialVaultListSort {
  const raw = filters.sort;
  if (vaultListScope === 'trash') {
    if (raw === 'name_asc') return 'name_asc';
    return 'created_desc';
  }
  if (raw === 'name_asc' || raw === 'created_desc') return raw;
  return 'recent';
}

/** Maps legacy `all` / wrong-scope values to the current sort filter token. */
export function normalizeCredentialVaultSortFilter(
  raw: string | undefined,
  vaultListScope: VaultListScope,
): string {
  if (vaultListScope === 'trash') {
    if (raw === 'name_asc') return 'name_asc';
    return CREDENTIAL_VAULT_DEFAULT_SORT_ARCHIVED;
  }
  if (raw === 'name_asc' || raw === 'created_desc') return raw;
  return CREDENTIAL_VAULT_DEFAULT_SORT_ACTIVE;
}
