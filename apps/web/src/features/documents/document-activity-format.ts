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
  return null;
}
