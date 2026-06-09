import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

const HTML_LIKE_RE = /<\/?[a-z][\s\S]*>/i;

const ALLOWED_STYLE_PROPS = new Set([
  'font-size',
  'font-family',
  'color',
  'background-color',
  'text-align',
  'border',
  'border-collapse',
  'width',
  'padding',
  'vertical-align',
  'text-decoration',
  'margin',
]);

export const MAIL_COMPOSE_PURIFY_CONFIG: Config = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: [
    'p',
    'br',
    'div',
    'span',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'code',
    'mark',
    'blockquote',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'colspan', 'rowspan', 'align'],
  FORBID_TAGS: [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'link',
    'meta',
    'base',
    'style',
  ],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
};

function sanitizeInlineStyle(style: string): string {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) {
        return false;
      }
      const colon = part.indexOf(':');
      if (colon <= 0) {
        return false;
      }
      const prop = part.slice(0, colon).trim().toLowerCase();
      const value = part
        .slice(colon + 1)
        .trim()
        .toLowerCase();
      if (value.includes('javascript:') || value.includes('expression(')) {
        return false;
      }
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join('; ');
}

let composeSanitizerHookRegistered = false;

function ensureComposeSanitizerHooks(): void {
  if (composeSanitizerHookRegistered || typeof window === 'undefined') {
    return;
  }
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style' && data.attrValue) {
      data.attrValue = sanitizeInlineStyle(data.attrValue);
      if (!data.attrValue) {
        data.keepAttr = false;
      }
    }
    if (data.attrName === 'class') {
      const tag = node.tagName?.toLowerCase();
      if (tag === 'pre' && data.attrValue.includes('bxhtmled-code')) {
        data.attrValue = 'bxhtmled-code';
        return;
      }
      data.keepAttr = false;
    }
  });
  composeSanitizerHookRegistered = true;
}

function normalizeBxCodePre(html: string): string {
  return html.replace(
    /<pre\b[^>]*class=["'][^"']*bxhtmled-code[^"']*["'][^>]*>/gi,
    '<pre class="bxhtmled-code">',
  );
}

/** Sanitizes compose / preview / storage HTML on the client. */
export function sanitizeComposeEmailHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html;
  }
  ensureComposeSanitizerHooks();
  return DOMPurify.sanitize(normalizeBxCodePre(html), MAIL_COMPOSE_PURIFY_CONFIG);
}

function stripEmptyEditorHtml(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0 ? '' : html;
}

export function htmlToPlainTextFallback(html: string): string {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, '').trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\u00a0/g, ' ').trim();
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
