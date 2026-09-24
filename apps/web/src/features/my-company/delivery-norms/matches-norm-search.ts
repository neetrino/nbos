export function matchesNormSearch(query: string, parts: readonly string[]): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  return parts.some((part) => part.toLowerCase().includes(needle));
}

export function filterSearchOptions<T extends { label: string; value: string; subtitle?: string }>(
  options: readonly T[],
  query: string,
  limit: number,
): T[] {
  const matched = options.filter((option) =>
    matchesNormSearch(query, [option.label, option.value, option.subtitle ?? '']),
  );
  return matched.slice(0, limit);
}

export function itemsMatchingSearch<T>(
  items: readonly T[],
  query: string,
  parts: (item: T) => readonly string[],
): T[] {
  return items.filter((item) => matchesNormSearch(query, parts(item)));
}
