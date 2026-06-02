/** Vault list sort modes (query param `sort`). */
export type CredentialListSort = 'recent' | 'name_asc' | 'created_desc';

const VALID_SORTS = new Set<CredentialListSort>(['recent', 'name_asc', 'created_desc']);

/** Archived lists ignore activity sort — always newest first. */
export function normalizeCredentialListSort(
  raw: string | undefined,
  includeArchived: boolean,
): CredentialListSort {
  if (includeArchived) return 'created_desc';
  if (raw && VALID_SORTS.has(raw as CredentialListSort) && raw !== 'recent') {
    return raw as CredentialListSort;
  }
  return 'recent';
}
