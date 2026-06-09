import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import {
  MAIL_EMAIL_ALLOWED_URI_REGEXP,
  MAIL_EMAIL_PURIFY_CONFIG,
  ensureMailEmailPurifyHooks,
  sanitizeMailEmailInlineStyle,
} from './mail-email-purify-config';

const HTML_LIKE_RE = /<\/?[a-z][\s\S]*>/i;

export const MAIL_COMPOSE_PURIFY_CONFIG: Config = MAIL_EMAIL_PURIFY_CONFIG;

let composeSanitizerHookRegistered = false;

function ensureComposeSanitizerHooks(): void {
  if (composeSanitizerHookRegistered || typeof window === 'undefined') {
    return;
  }
  ensureMailEmailPurifyHooks(DOMPurify);
  composeSanitizerHookRegistered = true;
}

/** Sanitizes compose / preview / storage HTML on the client. */
export function sanitizeComposeEmailHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html;
  }
  ensureComposeSanitizerHooks();
  return DOMPurify.sanitize(html, MAIL_COMPOSE_PURIFY_CONFIG);
}

function normalizeExtractedPlainText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

/** Parser-based plain text extraction (no regex tag stripping). */
export function extractPlainTextFromHtml(html: string): string {
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return normalizeExtractedPlainText(doc.body.textContent ?? '');
  }
  if (typeof window !== 'undefined') {
    ensureComposeSanitizerHooks();
    const stripped = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    return normalizeExtractedPlainText(stripped);
  }
  return '';
}

function stripEmptyEditorHtml(html: string): string {
  const text = extractPlainTextFromHtml(html);
  return text.length === 0 ? '' : html;
}

export function htmlToPlainTextFallback(html: string): string {
  return extractPlainTextFromHtml(html);
}

export function isHtmlLikeValue(value: string): boolean {
  return HTML_LIKE_RE.test(value.trim());
}

export function composeValueToEditorHtml(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }
  if (isHtmlLikeValue(trimmed)) {
    return sanitizeComposeEmailHtml(trimmed);
  }
  const lines = trimmed.split(/\r?\n/);
  return lines.map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`).join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Sanitized HTML for API storage; empty → null. */
export function composeEditorHtmlToValue(html: string): string | null {
  const sanitized = sanitizeComposeEmailHtml(html);
  const stripped = stripEmptyEditorHtml(sanitized);
  return stripped.length > 0 ? stripped : null;
}

export function isComposeHtmlEmpty(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return true;
  }
  return composeEditorHtmlToValue(composeValueToEditorHtml(value)) === null;
}

// Re-export for toolbar hooks that may reference inline style sanitizer.
export { sanitizeMailEmailInlineStyle, MAIL_EMAIL_ALLOWED_URI_REGEXP };
