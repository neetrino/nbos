import { parseEnvBundleText, type EnvBundleEntry } from '@nbos/shared';

/** Multi-line or multiple KEY=value pairs — paste into any table cell. */
export function clipLooksLikeEnvBundle(clip: string): boolean {
  const trimmed = clip.trim();
  if (!trimmed) return false;
  if (trimmed.includes('\n')) return true;
  return parseEnvBundleText(trimmed).entries.length > 1;
}

/** Single `KEY=value` line pasted into a row cell. */
export function clipSingleEnvPair(clip: string): EnvBundleEntry | null {
  const trimmed = clip.trim();
  if (!trimmed || trimmed.includes('\n')) return null;
  const parsed = parseEnvBundleText(trimmed);
  if (parsed.entries.length !== 1) return null;
  return parsed.entries[0] ?? null;
}
