import { entriesFromEnvBundleSerialized, type EnvBundleEntry } from '@nbos/shared';

/** Keys persisted on the server (baseline snapshot), not live in-progress edits. */
export function envBundleStoredKeySet(serializedBaseline: string): ReadonlySet<string> {
  return new Set(
    entriesFromEnvBundleSerialized(serializedBaseline)
      .map((entry) => entry.key)
      .filter((key) => key.trim().length > 0),
  );
}

/** Map of revealed ENV values keyed by variable name. */
export function revealedEnvValueByKey(
  revealedSerialized: string | null | undefined,
): Map<string, string> {
  if (!revealedSerialized?.trim()) return new Map();
  return new Map(
    entriesFromEnvBundleSerialized(revealedSerialized).map((entry) => [entry.key, entry.value]),
  );
}

function mergeRevealedIntoRows(
  rows: EnvBundleEntry[],
  revealedByKey: ReadonlyMap<string, string>,
): EnvBundleEntry[] {
  return rows.map((row) => {
    if (row.value.trim().length > 0) return row;
    if (!row.key.trim()) return row;
    const revealed = revealedByKey.get(row.key);
    if (revealed === undefined) return row;
    return { key: row.key, value: revealed };
  });
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
  const revealedByKey = new Map(parsedFromRevealed.map((entry) => [entry.key, entry.value]));

  if (!valuesLocked && parsedFromRevealed.length > 0) {
    if (localEntries.length > 0) {
      return mergeRevealedIntoRows(localEntries, revealedByKey);
    }
    return parsedFromRevealed;
  }

  if (localEntries.length > 0) return localEntries;

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
