export const CREDENTIAL_CATEGORY_CATALOG = [
  { category: 'ADMIN', credentialType: 'LOGIN_PASSWORD', label: 'Admin' },
  { category: 'API_KEY', credentialType: 'API_KEY', label: 'API Key' },
  { category: 'DATABASE', credentialType: 'DATABASE', label: 'Database' },
  { category: 'DOMAIN', credentialType: 'DOMAIN_REGISTRAR', label: 'Domain' },
  { category: 'HOSTING', credentialType: 'HOSTING_SERVER', label: 'Hosting' },
  { category: 'SSH', credentialType: 'SSH_PRIVATE_KEY', label: 'SSH' },
  { category: 'APP', credentialType: 'APP_STORE_ACCOUNT', label: 'App Store' },
  { category: 'MAIL', credentialType: 'MAIL_SMTP', label: 'Mail' },
  { category: 'SERVICE', credentialType: 'LOGIN_PASSWORD', label: 'Service' },
  { category: 'ENV', credentialType: 'ENV_BUNDLE', label: 'ENV' },
] as const;

export type CatalogCredentialCategory = (typeof CREDENTIAL_CATEGORY_CATALOG)[number]['category'];

const TYPE_BY_CATEGORY: Record<string, string> = Object.fromEntries(
  CREDENTIAL_CATEGORY_CATALOG.map((entry) => [entry.category, entry.credentialType]),
);

export const CATALOG_CATEGORY_CODES: readonly CatalogCredentialCategory[] =
  CREDENTIAL_CATEGORY_CATALOG.map((entry) => entry.category);

/** Catch-all when a stored category is unknown or legacy Other. */
export const FALLBACK_CREDENTIAL_CATEGORY = 'SERVICE' as const;

export function isCatalogCategory(category: string): category is CatalogCredentialCategory {
  return category in TYPE_BY_CATEGORY;
}

export function credentialTypeForCategory(category: string): string | null {
  return TYPE_BY_CATEGORY[category] ?? null;
}

export function catalogEntryForCategory(category: string) {
  return CREDENTIAL_CATEGORY_CATALOG.find((entry) => entry.category === category) ?? null;
}

/**
 * Expand-and-contract backfill: ENV/SSH types win first, then leftover Other → Service.
 */
export function resolveCredentialCategoryBackfill(input: {
  category: string;
  credentialType: string;
}): string {
  if (input.credentialType === 'ENV_BUNDLE') return 'ENV';
  if (input.credentialType === 'SSH_PRIVATE_KEY') return 'SSH';
  if (input.category === 'OTHER') return FALLBACK_CREDENTIAL_CATEGORY;
  return input.category;
}
