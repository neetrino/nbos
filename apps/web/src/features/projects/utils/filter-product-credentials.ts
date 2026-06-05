import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import {
  CREDENTIAL_VAULT_DEFAULT_FILTER_VALUES,
  normalizeCredentialVaultSortFilter,
  resolveCredentialVaultListSort,
  type CredentialVaultListSort,
} from '@/features/credentials/constants/credential-vault-list-sort';
import {
  filterCredentialsByQuickCategory,
  quickCategoryChipsForVaultScope,
  type CredentialCategoryOption,
} from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

const VAULT_SCOPE = 'project' as const;

function credentialMatchesSearch(credential: CredentialListItem, needle: string): boolean {
  return (
    credential.name.toLowerCase().includes(needle) ||
    (credential.provider?.toLowerCase().includes(needle) ?? false) ||
    (credential.login?.toLowerCase().includes(needle) ?? false) ||
    (credential.url?.toLowerCase().includes(needle) ?? false)
  );
}

function credentialNeedsRotation(credential: CredentialListItem): boolean {
  const status = credential.health?.status;
  return status === 'OVERDUE' || status === 'DUE_SOON';
}

function sortCredentialListItems(
  items: CredentialListItem[],
  sort: CredentialVaultListSort,
): CredentialListItem[] {
  const copy = [...items];
  if (sort === 'name_asc') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }
  copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return copy;
}

export function filterProductCredentials(
  credentials: CredentialListItem[],
  options: {
    search: string;
    filters: Record<string, string>;
    quickCategory: string | null;
    quickFilters: Set<CredentialQuickFilterKey>;
    quickCategoryChips: readonly CredentialCategoryOption[];
  },
): CredentialListItem[] {
  const needle = options.search.trim().toLowerCase();
  let rows = credentials;

  if (needle) {
    rows = rows.filter((credential) => credentialMatchesSearch(credential, needle));
  }

  const category = options.filters.category;
  if (category && category !== 'all') {
    rows = rows.filter((credential) => credential.category === category);
  }

  const credentialType = options.filters.credentialType;
  if (credentialType && credentialType !== 'all') {
    rows = rows.filter((credential) => credential.credentialType === credentialType);
  }

  if (options.quickFilters.has('needsRotation')) {
    rows = rows.filter(credentialNeedsRotation);
  }

  const sort = resolveCredentialVaultListSort(options.filters, 'active');
  rows = sortCredentialListItems(rows, sort);

  return filterCredentialsByQuickCategory(rows, options.quickCategory, options.quickCategoryChips);
}

export function productCredentialsQuickCategoryChips(): readonly CredentialCategoryOption[] {
  return quickCategoryChipsForVaultScope(VAULT_SCOPE);
}

export function productCredentialsDefaultFilters(): Record<string, string> {
  return { ...CREDENTIAL_VAULT_DEFAULT_FILTER_VALUES };
}

export function productCredentialsFilterValuesForUi(
  filters: Record<string, string>,
): Record<string, string> {
  return {
    ...filters,
    sort: normalizeCredentialVaultSortFilter(filters.sort, 'active'),
  };
}
