import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import type { CredentialVaultListSort } from '@/features/credentials/constants/credential-vault-list-sort';
import type { CredentialVaultPageSizeOption } from '@/features/credentials/constants/credential-vault-pagination';
import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import { vaultScopeToListTab } from '@/features/credentials/vault-scope';

export interface CredentialsVaultListQueryParams {
  viewMode: CredentialVaultViewMode;
  page: number;
  pageSize: CredentialVaultPageSizeOption;
  search: string;
  filters: Record<string, string>;
  quickCategory: string | null;
  quickFilters: Set<CredentialQuickFilterKey>;
  activeTab: CredentialVaultScope;
  vaultListScope: VaultListScope;
  listSort: CredentialVaultListSort;
  meId?: string;
  folderId?: string | null;
  withoutFolder?: boolean;
  projectId?: string | null;
}

export function resolveCredentialsVaultListProjectId(
  params: CredentialsVaultListQueryParams,
): string | undefined {
  if (
    params.vaultListScope === 'trash' &&
    params.filters.project &&
    params.filters.project !== 'all'
  ) {
    return params.filters.project;
  }
  if (params.viewMode === 'folders' && params.activeTab === 'project' && params.projectId) {
    return params.projectId;
  }
  return undefined;
}

export function resolveCredentialsVaultListCategory(
  params: CredentialsVaultListQueryParams,
  boardColumnKey?: string,
): string | undefined {
  if (boardColumnKey) return boardColumnKey;
  if (params.viewMode === 'category-board') {
    return params.filters.category && params.filters.category !== 'all'
      ? params.filters.category
      : undefined;
  }
  return (
    params.quickCategory ??
    (params.filters.category && params.filters.category !== 'all'
      ? params.filters.category
      : undefined)
  );
}

export function buildCredentialsVaultListRequest(
  params: CredentialsVaultListQueryParams,
  extras: { page: number; pageSize: number; category?: string },
): Record<string, unknown> {
  return {
    page: extras.page,
    pageSize: extras.pageSize,
    search: params.search || undefined,
    category: extras.category,
    credentialType:
      params.filters.credentialType && params.filters.credentialType !== 'all'
        ? params.filters.credentialType
        : undefined,
    accessLevel:
      params.activeTab === 'all' &&
      params.filters.accessLevel &&
      params.filters.accessLevel !== 'all'
        ? params.filters.accessLevel
        : undefined,
    ownerId:
      params.activeTab === 'all' && params.quickFilters.has('mine') && params.meId
        ? params.meId
        : undefined,
    needsRotation: params.quickFilters.has('needsRotation') ? true : undefined,
    favoritesOnly: params.quickFilters.has('favorites') ? true : undefined,
    folderId: params.viewMode === 'folders' && params.folderId ? params.folderId : undefined,
    withoutFolder:
      params.viewMode === 'folders' &&
      params.activeTab !== 'project' &&
      !params.folderId &&
      params.withoutFolder
        ? true
        : undefined,
    projectId: resolveCredentialsVaultListProjectId(params),
    tab: params.vaultListScope === 'trash' ? undefined : vaultScopeToListTab(params.activeTab),
    scope: params.vaultListScope === 'trash' ? 'trash' : 'active',
    sort: params.listSort,
  };
}
