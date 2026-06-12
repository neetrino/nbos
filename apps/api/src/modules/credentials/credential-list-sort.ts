/** Vault list sort modes (query param `sort`). */
export type CredentialListSort = 'recent' | 'name_asc' | 'created_desc';

const VALID_SORTS = new Set<CredentialListSort>(['recent', 'name_asc', 'created_desc']);

/** Trash lists ignore activity sort — default newest trashed first. */
export function normalizeCredentialListSort(
  raw: string | undefined,
  includeArchived: boolean,
): CredentialListSort {
  if (raw === 'name_asc') return 'name_asc';
  if (includeArchived) return 'created_desc';
  if (raw && VALID_SORTS.has(raw as CredentialListSort) && raw !== 'recent') {
    return raw as CredentialListSort;
  }
  return 'recent';
}
