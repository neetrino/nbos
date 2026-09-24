/** One draft per card volume so an older leftover cannot republish over a later edit. */
export function pickNewestDraftsByTier<T extends { version: number; tierId: string | null }>(
  drafts: readonly T[],
): T[] {
  const newest = new Map<string, T>();
  for (const draft of drafts) {
    const key = draft.tierId ?? '';
    const current = newest.get(key);
    if (!current || draft.version > current.version) {
      newest.set(key, draft);
    }
  }
  return [...newest.values()];
}
