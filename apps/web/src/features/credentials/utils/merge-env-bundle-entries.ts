import type { EnvBundleEntry } from '@nbos/shared';

/** Merge by key; incoming entries overwrite existing keys with the same name. */
export function mergeEnvBundleEntries(
  existing: EnvBundleEntry[],
  incoming: EnvBundleEntry[],
): EnvBundleEntry[] {
  const map = new Map<string, EnvBundleEntry>();
  for (const row of existing) {
    const key = row.key.trim();
    if (key) map.set(key, row);
  }
  for (const row of incoming) {
    const key = row.key.trim();
    if (key) map.set(key, row);
  }
  return Array.from(map.values());
}
