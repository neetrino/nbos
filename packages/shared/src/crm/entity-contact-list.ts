/** Merges primary FK contact with junction contacts into one ordered list (deduped). */
export function mergeEntityContactIds(
  primaryContactId: string | null | undefined,
  additionalContactIds: string[],
): string[] {
  const ids: string[] = [];
  if (primaryContactId) ids.push(primaryContactId);
  for (const id of additionalContactIds) {
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** First id is primary (deal/lead/project FK); rest go to junction table. */
export function splitEntityContactIds(contactIds: string[]): {
  primaryContactId: string | null;
  additionalContactIds: string[];
} {
  const unique = [...new Set(contactIds.filter(Boolean))];
  return {
    primaryContactId: unique[0] ?? null,
    additionalContactIds: unique.slice(1),
  };
}

export function contactIdListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, index) => id === sortedB[index]);
}
