import { entriesFromEnvBundleSerialized, type EnvBundleEntry } from '@nbos/shared';

/** Map of revealed ENV values keyed by variable name. */
export function revealedEnvValueByKey(
  revealedSerialized: string | null | undefined,
): Map<string, string> {
  if (!revealedSerialized?.trim()) return new Map();
  return new Map(
    entriesFromEnvBundleSerialized(revealedSerialized).map((entry) => [entry.key, entry.value]),
  );
}

/**
 * Builds table rows so each index is one `{ key, value }` pair — never split across sources.
 */
export function buildEnvTableRows(
  localEntries: EnvBundleEntry[],
  parsedFromValue: EnvBundleEntry[],
  parsedFromRevealed: EnvBundleEntry[],
  valuesLocked: boolean,
): EnvBundleEntry[] {
  if (localEntries.length > 0) return localEntries;

  if (!valuesLocked && parsedFromRevealed.length > 0) {
    return parsedFromRevealed;
  }

  if (parsedFromValue.length > 0) {
    return parsedFromValue;
  }

  if (parsedFromRevealed.length > 0) {
    return parsedFromRevealed.map(({ key }) => ({ key, value: '' }));
  }

  return [];
}

/** True when Value should show mask dots (stored secret, not revealed in form state). */
export function envRowValueIsMasked(
  row: EnvBundleEntry,
  showMasked: boolean,
  serverKeys: ReadonlySet<string>,
  revealedByKey: ReadonlyMap<string, string>,
): boolean {
  if (!showMasked || !row.key.trim()) return false;
  if (row.value.trim().length > 0) return false;
  if (revealedByKey.has(row.key)) return true;
  return serverKeys.has(row.key);
}
