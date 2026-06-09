import DOMPurify from 'isomorphic-dompurify';
import { MAIL_EMAIL_PURIFY_CONFIG, ensureMailEmailPurifyHooks } from './mail-email-purify-config';

ensureMailEmailPurifyHooks(DOMPurify);

const SUBJECT_PREFIXES = ['re', 'fwd', 'fw'] as const;
const MAX_SUBJECT_PREFIX_REMOVALS = 20;

function isAsciiWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function collapseWhitespace(text: string): string {
  let out = '';
  let prevWasSpace = false;
  for (const char of text) {
    if (isAsciiWhitespace(char)) {
      if (!prevWasSpace) {
        out += ' ';
        prevWasSpace = true;
      }
      continue;
    }
    out += char;
    prevWasSpace = false;
  }
  return out.trim();
}

function stripOneSubjectPrefix(subject: string): { stripped: boolean; rest: string } {
  let index = 0;
  while (index < subject.length && isAsciiWhitespace(subject[index] ?? '')) {
    index += 1;
  }
  const remaining = subject.slice(index);
  const lower = remaining.toLowerCase();
  for (const prefix of SUBJECT_PREFIXES) {
    if (!lower.startsWith(prefix)) {
      continue;
    }
    let cursor = prefix.length;
    while (cursor < remaining.length && isAsciiWhitespace(remaining[cursor] ?? '')) {
      cursor += 1;
    }
    if (remaining[cursor] !== ':') {
      continue;
    }
    cursor += 1;
    while (cursor < remaining.length && isAsciiWhitespace(remaining[cursor] ?? '')) {
      cursor += 1;
    }
    return { stripped: true, rest: remaining.slice(cursor) };
  }
  return { stripped: false, rest: subject };
}

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
  let current = subject;
  for (let count = 0; count < MAX_SUBJECT_PREFIX_REMOVALS; count += 1) {
    const { stripped, rest } = stripOneSubjectPrefix(current);
    if (!stripped) {
      break;
    }
    current = rest;
  }
  return collapseWhitespace(current);
}
