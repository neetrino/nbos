/** Splits a free-text search query into first / last name parts for contact quick-create. */
export function parseRelationSearchName(query: string): { firstName: string; lastName: string } {
  const trimmed = query.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}
