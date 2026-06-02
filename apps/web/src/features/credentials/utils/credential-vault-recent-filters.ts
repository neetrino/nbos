import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';

export interface CredentialVaultRecentFilterInput {
  search: string;
  quickCategory: string | null;
  filters: Record<string, string>;
  quickFilters: Set<CredentialQuickFilterKey>;
}

export function buildCredentialVaultRecentQueryParams(
  input: CredentialVaultRecentFilterInput,
): Record<string, string | boolean | undefined> {
  const category =
    input.quickCategory ??
    (input.filters.category && input.filters.category !== 'all'
      ? input.filters.category
      : undefined);
  const credentialType =
    input.filters.credentialType && input.filters.credentialType !== 'all'
      ? input.filters.credentialType
      : undefined;
  const search = input.search.trim() || undefined;

  return {
    search,
    category,
    credentialType,
    needsRotation: input.quickFilters.has('needsRotation') ? true : undefined,
  };
}
