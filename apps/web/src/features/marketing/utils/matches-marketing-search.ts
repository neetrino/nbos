/** Case-insensitive substring match across optional text fields. */
export function matchesMarketingSearch(
  query: string,
  ...fields: Array<string | null | undefined>
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return fields.some((field) => field?.toLowerCase().includes(normalized));
}
