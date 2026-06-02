import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

/** DB enum values allowed per vault scope (not one global list in UI). */
export const VAULT_CATEGORY_VALUES_BY_SCOPE = {
  my: ['MAIL', 'SERVICE', 'APP', 'OTHER'],
  team: ['SERVICE', 'MAIL', 'APP', 'OTHER'],
  project: ['ADMIN', 'DOMAIN', 'HOSTING', 'DATABASE', 'API_KEY', 'APP', 'MAIL', 'SERVICE', 'OTHER'],
  secret: ['ADMIN', 'API_KEY', 'DATABASE', 'HOSTING', 'DOMAIN', 'OTHER'],
} as const satisfies Record<Exclude<CredentialVaultScope, 'all'>, readonly string[]>;

export interface CredentialCategoryOption {
  value: string;
  label: string;
}

function labelsForValues(values: readonly string[]): CredentialCategoryOption[] {
  const labelByValue = new Map(CREDENTIAL_CATEGORIES.map((c) => [c.value, c.label]));
  return values.map((value) => ({
    value,
    label: labelByValue.get(value) ?? value.replaceAll('_', ' '),
  }));
}

/** Category options for vault scope; `all` uses full enum. */
export function categoriesForVaultScope(
  scope: CredentialVaultScope,
  extraValue?: string | null,
): CredentialCategoryOption[] {
  const values =
    scope === 'all'
      ? CREDENTIAL_CATEGORIES.map((c) => c.value)
      : [...VAULT_CATEGORY_VALUES_BY_SCOPE[scope]];

  const unique = new Set(values);
  if (extraValue && !unique.has(extraValue)) {
    unique.add(extraValue);
  }

  return labelsForValues([...unique]);
}

/** Quick-filter / board chips for the active vault tab. */
export function quickCategoryChipsForVaultScope(
  scope: CredentialVaultScope,
): readonly CredentialCategoryOption[] {
  return categoriesForVaultScope(scope);
}

export function defaultCategoryForVaultScope(
  scope: CredentialVaultScope,
  preset?: string,
  allowedOverride?: string[],
): string {
  const options = allowedOverride?.length
    ? labelsForValues(allowedOverride)
    : categoriesForVaultScope(scope);
  if (options.length === 1) return options[0].value;
  if (preset && options.some((o) => o.value === preset)) return preset;
  return options[0]?.value ?? 'OTHER';
}

export function isCategoryAllowedInVaultScope(
  scope: CredentialVaultScope,
  category: string,
): boolean {
  if (scope === 'all') return true;
  return (VAULT_CATEGORY_VALUES_BY_SCOPE[scope] as readonly string[]).includes(category);
}
