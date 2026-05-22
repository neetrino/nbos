import DOMPurify from 'dompurify';

const HTML_LIKE_RE = /<\/?[a-z][\s\S]*>/i;

const NOTES_PURIFY_CONFIG = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

function sanitizeNotesHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, NOTES_PURIFY_CONFIG);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainTextToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return '<p></p>';
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

export function isHtmlNotesValue(value: string): boolean {
  return HTML_LIKE_RE.test(value.trim());
}

/** Maps API/plain stored value into editor HTML. */
export function notesValueToEditorHtml(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  if (isHtmlNotesValue(trimmed)) {
    return sanitizeNotesHtml(trimmed);
  }
  return plainTextToHtml(trimmed);
}

function stripEmptyEditorHtml(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0 ? '' : html;
}

/** Sanitized HTML for API storage; empty → null. */
export function editorHtmlToNotesValue(html: string): string | null {
  const sanitized = sanitizeNotesHtml(html);
  const stripped = stripEmptyEditorHtml(sanitized);
  return stripped.length > 0 ? stripped : null;
}

/** Whether stored notes are empty (plain or HTML). */
export function isNotesValueEmpty(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return true;
  return editorHtmlToNotesValue(notesValueToEditorHtml(value)) === null;
}
