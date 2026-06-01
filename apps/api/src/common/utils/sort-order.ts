/**
 * Safe `orderBy` resolution for list endpoints.
 *
 * Prevents attacker-controlled `sortBy` values from reaching Prisma `orderBy`.
 * Even though Prisma rejects unknown columns (so this is not classic SQLi),
 * an unwhitelisted `sortBy` still enables field probing, runtime 500s, and
 * prototype-pollution-style keys. Callers pass an explicit allowlist; anything
 * outside it falls back to a known-safe field.
 */
export function resolveSortField(
  sortBy: string | undefined,
  allowedFields: ReadonlySet<string>,
  fallbackField: string,
): string {
  return sortBy && allowedFields.has(sortBy) ? sortBy : fallbackField;
}

/** Normalizes free-form sort direction to a strict `'asc' | 'desc'` (default `desc`). */
export function normalizeSortDirection(sortOrder?: string): 'asc' | 'desc' {
  return sortOrder === 'asc' ? 'asc' : 'desc';
}
