/** Default page size for List and Tiles views. */
export const CREDENTIAL_VAULT_PAGED_DEFAULT_SIZE = 30;

/** Selectable page sizes for List and Tiles. */
export const CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS = [15, 30, 50] as const;

export type CredentialVaultPageSizeOption = (typeof CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS)[number];

/** Initial cards per category-board column; more load on that column's scroll. */
export const CREDENTIAL_VAULT_KANBAN_COLUMN_PAGE_SIZE = 8;

export function isCredentialVaultPageSizeOption(
  value: number,
): value is CredentialVaultPageSizeOption {
  return (CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

export function normalizeCredentialVaultPageSize(value: unknown): CredentialVaultPageSizeOption {
  if (typeof value === 'number' && isCredentialVaultPageSizeOption(value)) {
    return value;
  }
  return CREDENTIAL_VAULT_PAGED_DEFAULT_SIZE;
}
