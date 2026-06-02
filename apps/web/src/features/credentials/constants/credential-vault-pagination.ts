/** Default page size for List and Tiles views. */
export const CREDENTIAL_VAULT_PAGED_DEFAULT_SIZE = 30;

/** Selectable page sizes for List and Tiles. */
export const CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS = [15, 30, 50] as const;

export type CredentialVaultPageSizeOption = (typeof CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS)[number];

/** Records fetched per scroll chunk in Category Board view. */
export const CREDENTIAL_VAULT_BOARD_CHUNK_SIZE = 30;

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

/** Builds compact page number sequence with ellipsis gaps. */
export function buildCredentialVaultPageSequence(
  page: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const anchors = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...anchors].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const sequence: Array<number | 'ellipsis'> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (current === undefined) continue;
    if (previous !== undefined && current - previous > 1) {
      sequence.push('ellipsis');
    }
    sequence.push(current);
  }
  return sequence;
}
