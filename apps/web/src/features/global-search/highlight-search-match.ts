export type SearchHighlightSegment = {
  text: string;
  match: boolean;
};

/** Splits text into match/non-match segments for safe React rendering (no HTML injection). */
export function splitSearchHighlight(text: string, query: string): SearchHighlightSegment[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [{ text, match: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const segments: SearchHighlightSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = lowerText.indexOf(lowerQuery, cursor);
    if (index === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), match: false });
    }
    segments.push({
      text: text.slice(index, index + trimmedQuery.length),
      match: true,
    });
    cursor = index + trimmedQuery.length;
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}
