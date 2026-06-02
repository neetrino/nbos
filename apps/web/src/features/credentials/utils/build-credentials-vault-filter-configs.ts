import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  ACCESS_LEVELS,
  CREDENTIAL_CATEGORIES,
  CREDENTIAL_TYPES,
} from '@/features/credentials/constants/credentials';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

function buildSortFilterConfig(vaultListScope: 'active' | 'archived'): FilterConfig {
  if (vaultListScope === 'archived') {
    return {
      key: 'sort',
      label: 'Sort',
      includeAllOption: false,
      defaultOptionValue: 'created_desc',
      defaultOptionLabel: 'Newest first',
      options: [{ value: 'name_asc', label: 'Name (A–Z)' }],
    };
  }
  return {
    key: 'sort',
    label: 'Sort',
    includeAllOption: false,
    defaultOptionValue: 'recent',
    defaultOptionLabel: 'Recently used',
    options: [
      { value: 'name_asc', label: 'Name (A–Z)' },
      { value: 'created_desc', label: 'Newest first' },
    ],
  };
}

export function buildCredentialsVaultFilterConfigs(
  activeTab: CredentialVaultScope,
  vaultListScope: 'active' | 'archived' = 'active',
): FilterConfig[] {
  const base: FilterConfig[] = [
    buildSortFilterConfig(vaultListScope),
    {
      key: 'category',
      label: 'Category',
      options: CREDENTIAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      key: 'credentialType',
      label: 'Type',
      options: CREDENTIAL_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
  ];
  if (activeTab !== 'all') return base;
  return [
    ...base,
    {
      key: 'accessLevel',
      label: 'Access type',
      options: ACCESS_LEVELS.map((l) => ({ value: l.value, label: l.label })),
    },
  ];
}
