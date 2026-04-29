const SNIPPET_RADIUS_CHARS = 110;

/**
 * Short excerpt around the first case-insensitive match of `term`, for list cards.
 */
export function pickDocumentSearchSnippet(
  plainText: string | null | undefined,
  description: string | null | undefined,
  title: string,
  termRaw: string,
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

  return (
    pick(plainText) ?? pick(description) ?? (title.toLowerCase().includes(term) ? title : undefined)
  );
}
