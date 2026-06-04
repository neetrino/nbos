/**
 * MVP-level email HTML sanitizer: strips script/style blocks, inline event
 * handlers and javascript: URLs before the value is ever persisted or rendered.
 * (Rich rendering uses the plaintext body; this guards any HTML surface.)
 */
export function sanitizeEmailHtml(html: string | null): string | null {
  if (!html) {
    return null;
  }
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}

/** Normalizes a subject for thread grouping (drops Re:/Fwd: prefixes, collapses space). */
export function normalizeEmailSubject(subject: string): string {
  return subject
    .replace(/^(\s*(re|fwd|fw)\s*:\s*)+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
