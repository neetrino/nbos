/**
 * Builds a stable path inside the ZIP from `displayName`, disambiguating duplicate leaf names.
 */
export function disambiguatedZipEntryPath(
  displayName: string,
  fileId: string,
  counts: Map<string, number>,
): string {
  const normalized = displayName.replace(/\\/g, '/').trim() || 'file';
  const leaf = normalized.includes('/')
    ? normalized.slice(normalized.lastIndexOf('/') + 1)
    : normalized;
  const safe =
    leaf
      .replace(/[/\\]/g, '_')
      .replace(/[^\w.\-()\s\u0400-\u04FF]+/g, '_')
      .trim()
      .slice(0, 160) || 'file';
  const prev = counts.get(safe) ?? 0;
  counts.set(safe, prev + 1);
  if (prev === 0) return `files/${safe}`;
  return `files/${safe}__${fileId.slice(0, 8)}`;
}
