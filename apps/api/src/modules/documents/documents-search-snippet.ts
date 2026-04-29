const SNIPPET_RADIUS_CHARS = 110;

export type AttachmentFileNameRow = {
  fileAsset: { displayName: string; originalName: string | null };
};

/** Builds a flat list of searchable file labels from list `attachments` include. */
export function collectAttachmentSearchNames(
  attachments: AttachmentFileNameRow[] | undefined,
): string[] | undefined {
  if (!attachments?.length) return undefined;
  const names: string[] = [];
  for (const a of attachments) {
    const primary = a.fileAsset.displayName?.trim();
    const orig = a.fileAsset.originalName?.trim();
    if (primary) names.push(primary);
    if (orig && orig !== primary) names.push(orig);
  }
  return names.length > 0 ? names : undefined;
}

/**
 * Short excerpt around the first case-insensitive match of `term`, for list cards.
 */
export function pickDocumentSearchSnippet(
  plainText: string | null | undefined,
  description: string | null | undefined,
  title: string,
  termRaw: string,
  attachmentFileNames?: readonly string[],
): string | undefined {
  const term = termRaw.trim().toLowerCase();
  if (!term) return undefined;

  const pick = (text: string | null | undefined): string | undefined => {
    if (!text) return undefined;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(term);
    if (idx < 0) return undefined;
    const start = Math.max(0, idx - SNIPPET_RADIUS_CHARS);
    const end = Math.min(text.length, idx + term.length + SNIPPET_RADIUS_CHARS);
    const slice = text.slice(start, end).replace(/\s+/g, ' ').trim();
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';
    return `${prefix}${slice}${suffix}`;
  };

  const attachmentBlob =
    attachmentFileNames && attachmentFileNames.length > 0
      ? attachmentFileNames.filter((n) => n.trim().length > 0).join('\n')
      : undefined;

  return (
    pick(plainText) ??
    pick(description) ??
    (title.toLowerCase().includes(term) ? title : undefined) ??
    pick(attachmentBlob)
  );
}
