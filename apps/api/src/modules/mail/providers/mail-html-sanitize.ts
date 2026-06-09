import DOMPurify from 'isomorphic-dompurify';
import { MAIL_EMAIL_PURIFY_CONFIG, ensureMailEmailPurifyHooks } from './mail-email-purify-config';

ensureMailEmailPurifyHooks(DOMPurify);

/**
 * Email HTML sanitizer: parser-based allowlist via DOMPurify (isomorphic + jsdom).
 * Strips scripts, event handlers, unsafe URLs/styles, and dangerous tags.
 */
export function sanitizeEmailHtml(html: string | null): string | null {
  if (!html) {
    return null;
  }
  const out = String(DOMPurify.sanitize(html, MAIL_EMAIL_PURIFY_CONFIG));
  const trimmed = out.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Normalizes a subject for thread grouping (drops Re:/Fwd: prefixes, collapses space). */
export function normalizeEmailSubject(subject: string): string {
  return subject
    .replace(/^(\s*(re|fwd|fw)\s*:\s*)+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
