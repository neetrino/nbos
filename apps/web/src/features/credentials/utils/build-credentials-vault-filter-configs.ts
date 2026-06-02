import {
  ACCESS_LEVELS,
  CREDENTIAL_CATEGORIES,
  CREDENTIAL_TYPES,
} from '@/features/credentials/constants/credentials';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface VaultFilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export function buildCredentialsVaultFilterConfigs(
  activeTab: CredentialVaultScope,
): VaultFilterConfig[] {
  const base: VaultFilterConfig[] = [
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
