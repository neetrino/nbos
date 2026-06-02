import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import type { CredentialVaultListScope } from '@/features/credentials/constants/credential-vault-page-state-storage';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface CredentialVaultSavedView {
  id: string;
  name: string;
  createdAt: string;
  activeTab: CredentialVaultScope;
  vaultListScope: CredentialVaultListScope;
  viewMode: CredentialVaultViewMode;
  search: string;
  filters: Record<string, string>;
  quickCategory: string | null;
  quickFilters: CredentialQuickFilterKey[];
}

export interface CredentialVaultSavedViewSnapshot {
  activeTab: CredentialVaultScope;
  vaultListScope: CredentialVaultListScope;
  viewMode: CredentialVaultViewMode;
  search: string;
  filters: Record<string, string>;
  quickCategory: string | null;
  quickFilters: Set<CredentialQuickFilterKey>;
}
