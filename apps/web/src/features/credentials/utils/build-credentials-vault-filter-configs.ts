import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  ACCESS_LEVELS,
  CREDENTIAL_CATEGORIES,
  CREDENTIAL_TYPES,
  credentialAccessMessageKey,
  credentialCategoryMessageKey,
  credentialTypeMessageKey,
} from '@/features/credentials/constants/credentials';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface CredentialsVaultFilterCopy {
  sortLabel: string;
  categoryLabel: string;
  typeLabel: string;
  projectLabel: string;
  accessTypeLabel: string;
  sortRecent: string;
  sortName: string;
  sortNewest: string;
  sortTrashed: string;
  categoryOptionLabel: (value: string, fallback: string) => string;
  typeOptionLabel: (value: string, fallback: string) => string;
  accessOptionLabel: (value: string, fallback: string) => string;
}

export function buildCredentialsVaultFilterCopy(
  t: (key: string) => string,
): CredentialsVaultFilterCopy {
  const enumLabel = (
    resolveKey: (value: string) => string | null,
    value: string,
    fallback: string,
  ) => {
    const key = resolveKey(value);
    return key ? t(key) : fallback;
  };

  return {
    sortLabel: t('filters.sort'),
    categoryLabel: t('filters.category'),
    typeLabel: t('filters.type'),
    projectLabel: t('filters.project'),
    accessTypeLabel: t('filters.accessType'),
    sortRecent: t('filters.sortRecent'),
    sortName: t('filters.sortName'),
    sortNewest: t('filters.sortNewest'),
    sortTrashed: t('filters.sortTrashed'),
    categoryOptionLabel: (value, fallback) =>
      enumLabel(credentialCategoryMessageKey, value, fallback),
    typeOptionLabel: (value, fallback) => enumLabel(credentialTypeMessageKey, value, fallback),
    accessOptionLabel: (value, fallback) => enumLabel(credentialAccessMessageKey, value, fallback),
  };
}

function buildSortFilterConfig(
  vaultListScope: 'active' | 'trash',
  copy?: CredentialsVaultFilterCopy,
): FilterConfig {
  if (vaultListScope === 'trash') {
    return {
      key: 'sort',
      label: copy?.sortLabel ?? 'Sort',
      includeAllOption: false,
      defaultOptionValue: 'created_desc',
      defaultOptionLabel: copy?.sortTrashed ?? 'Trashed (newest)',
      options: [{ value: 'name_asc', label: copy?.sortName ?? 'Name (A–Z)' }],
    };
  }
  return {
    key: 'sort',
    label: copy?.sortLabel ?? 'Sort',
    includeAllOption: false,
    defaultOptionValue: 'recent',
    defaultOptionLabel: copy?.sortRecent ?? 'Recently used',
    options: [
      { value: 'name_asc', label: copy?.sortName ?? 'Name (A–Z)' },
      { value: 'created_desc', label: copy?.sortNewest ?? 'Newest first' },
    ],
  };
}

export function buildCredentialsVaultFilterConfigs(
  activeTab: CredentialVaultScope,
  vaultListScope: 'active' | 'trash' = 'active',
  projectFilterOptions: Array<{ value: string; label: string }> = [],
  copy?: CredentialsVaultFilterCopy,
): FilterConfig[] {
  const base: FilterConfig[] = [
    buildSortFilterConfig(vaultListScope, copy),
    {
      key: 'category',
      label: copy?.categoryLabel ?? 'Category',
      options: CREDENTIAL_CATEGORIES.map((c) => ({
        value: c.value,
        label: copy?.categoryOptionLabel(c.value, c.label) ?? c.label,
      })),
    },
    {
      key: 'credentialType',
      label: copy?.typeLabel ?? 'Type',
      options: CREDENTIAL_TYPES.map((item) => ({
        value: item.value,
        label: copy?.typeOptionLabel(item.value, item.label) ?? item.label,
      })),
    },
  ];

  if (vaultListScope === 'trash' && projectFilterOptions.length > 0) {
    base.push({
      key: 'project',
      label: copy?.projectLabel ?? 'Project',
      options: projectFilterOptions,
    });
  }

  if (activeTab !== 'all') return base;
  return [
    ...base,
    {
      key: 'accessLevel',
      label: copy?.accessTypeLabel ?? 'Access type',
      options: ACCESS_LEVELS.map((level) => ({
        value: level.value,
        label: copy?.accessOptionLabel(level.value, level.label) ?? level.label,
      })),
    },
  ];
}
