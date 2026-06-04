import type { EnvBundleEntry } from '@nbos/shared';

/** Row holds a stored or edited secret worth confirming before delete/overwrite. */
export function envRowHasProtectedData(
  row: EnvBundleEntry,
  serverKeys: ReadonlySet<string>,
  revealedByKey: ReadonlyMap<string, string>,
): boolean {
  const key = row.key.trim();
  if (!key) return row.value.trim().length > 0;
  if (row.value.trim().length > 0) return true;
  if (serverKeys.has(key)) return true;
  return (revealedByKey.get(key) ?? '').trim().length > 0;
}

export function findEnvRowIndexByKey(
  rows: EnvBundleEntry[],
  key: string,
  exceptIndex?: number,
): number {
  const trimmed = key.trim();
  if (!trimmed) return -1;
  return rows.findIndex((row, index) => index !== exceptIndex && row.key.trim() === trimmed);
}

/** Incoming paste lines that would replace non-empty or stored existing keys. */
export function countEnvMergeOverwrites(
  existing: EnvBundleEntry[],
  incoming: EnvBundleEntry[],
  serverKeys: ReadonlySet<string>,
  revealedByKey: ReadonlyMap<string, string>,
): number {
  let count = 0;
  for (const line of incoming) {
    const key = line.key.trim();
    if (!key) continue;
    const index = findEnvRowIndexByKey(existing, key);
    if (index < 0) continue;
    const row = existing[index];
    if (row === undefined) continue;
    if (envRowHasProtectedData(row, serverKeys, revealedByKey)) count += 1;
  }
  return count;
}
