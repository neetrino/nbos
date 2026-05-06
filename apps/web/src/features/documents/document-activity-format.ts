function shortRef(id: string): string {
  return id.length <= 14 ? id : `${id.slice(0, 8)}…`;
}

/**
 * One-line human detail for document activity `metadata` JSON (when present).
 */
export function formatDocumentActivityDetail(action: string, metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;

  if (
    (action === 'attachment_added' || action === 'attachment_removed') &&
    typeof m.fileAssetId === 'string'
  ) {
    return `File ${shortRef(m.fileAssetId)}`;
  }
  if (action === 'created' && typeof m.title === 'string') {
    return `“${m.title}”`;
  }
  if (action === 'access_changed') {
    const next = m.listScopeOverride;
    const prev = m.previousListScopeOverride;
    const nextLabel = next === null || next === undefined ? 'section default' : String(next);
    const prevLabel = prev === null || prev === undefined ? 'section default' : String(prev);
    return `List scope ${prevLabel} → ${nextLabel}`;
  }
  if (action === 'restored' && typeof m.status === 'string') {
    return `Now ${m.status.toLowerCase()}`;
  }
  if (action === 'exported' && typeof m.format === 'string') {
    return `Format ${String(m.format).toLowerCase()}`;
  }
  return null;
}
