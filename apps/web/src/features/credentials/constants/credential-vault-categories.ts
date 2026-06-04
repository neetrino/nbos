import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
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
  const labelByValue = new Map<string, string>(
    CREDENTIAL_CATEGORIES.map((c) => [c.value, c.label]),
  );
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

  const unique = new Set<string>(values);
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

/** Maps a credential category to a visible board column (unknown → OTHER). */
export function resolveCredentialCategoryBucket(
  category: string,
  categoryColumns: readonly CredentialCategoryOption[],
): string {
  const allowed = new Set(categoryColumns.map((column) => column.value));
  return allowed.has(category) ? category : 'OTHER';
}

/** Category board columns: all scope chips, or a single chip when a quick filter is active. */
export function categoryBoardColumnsForQuickFilter(
  chips: readonly CredentialCategoryOption[],
  activeCategory: string | null,
): readonly CredentialCategoryOption[] {
  if (!activeCategory) return chips;
  const filtered = chips.filter((chip) => chip.value === activeCategory);
  return filtered.length > 0 ? filtered : chips;
}

/** Client-side quick category filter for the category board (no refetch). */
export function filterCredentialsByQuickCategory(
  credentials: CredentialListItem[],
  activeCategory: string | null,
  categoryColumns: readonly CredentialCategoryOption[],
): CredentialListItem[] {
  if (!activeCategory) return credentials;
  return credentials.filter(
    (credential) =>
      resolveCredentialCategoryBucket(credential.category, categoryColumns) === activeCategory,
  );
}

export function defaultCategoryForVaultScope(
  scope: CredentialVaultScope,
  preset?: string,
  allowedOverride?: string[],
): string {
  const options = allowedOverride?.length
    ? labelsForValues(allowedOverride)
    : categoriesForVaultScope(scope);
  if (options.length === 1) return options[0]?.value ?? 'OTHER';
  if (preset && options.some((o) => o.value === preset)) return preset;
  return options[0]?.value ?? 'OTHER';
}
