import type { Config } from 'dompurify';

/** Inline CSS properties allowed in compose / inbound email HTML. */
export const MAIL_EMAIL_ALLOWED_STYLE_PROPS = new Set([
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

const MAIL_EMAIL_FORBIDDEN_STYLE_VALUE_RE =
  /javascript:|expression\s*\(|url\s*\(|@import|behavior\s*:/i;

/** Allow http(s), mailto, tel, and relative URLs; block javascript:, data:, etc. */
export const MAIL_EMAIL_ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|[^a-z+.-]+(?:\/|$))/i;

export const MAIL_EMAIL_PURIFY_CONFIG: Config = {
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
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'link',
    'meta',
    'base',
    'svg',
    'math',
  ],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOWED_URI_REGEXP: MAIL_EMAIL_ALLOWED_URI_REGEXP,
};

export function sanitizeMailEmailInlineStyle(style: string): string {
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
      const value = part.slice(colon + 1).trim();
      const valueLower = value.toLowerCase();
      if (MAIL_EMAIL_FORBIDDEN_STYLE_VALUE_RE.test(valueLower)) {
        return false;
      }
      if (prop === 'position' || prop === 'z-index' || prop.includes('expression')) {
        return false;
      }
      return MAIL_EMAIL_ALLOWED_STYLE_PROPS.has(prop);
    })
    .join('; ');
}

type DomPurifyHookHost = {
  addHook(entryPoint: 'uponSanitizeAttribute', hookFunction: UponSanitizeAttributeHook): void;
  addHook(entryPoint: 'afterSanitizeAttributes', hookFunction: AfterSanitizeAttributesHook): void;
};

type UponSanitizeAttributeHook = (
  node: Element,
  data: { attrName: string; attrValue: string; keepAttr: boolean },
) => void;

type AfterSanitizeAttributesHook = (node: Element) => void;

let mailEmailPurifyHooksRegistered = false;

/** Registers style/class/href hooks once per DOMPurify instance (browser or isomorphic). */
export function ensureMailEmailPurifyHooks(purify: DomPurifyHookHost): void {
  if (mailEmailPurifyHooksRegistered) {
    return;
  }

  purify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style' && data.attrValue) {
      data.attrValue = sanitizeMailEmailInlineStyle(data.attrValue);
      if (!data.attrValue) {
        data.keepAttr = false;
      }
      return;
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

  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A' || !node.hasAttribute('href')) {
      return;
    }
    const href = node.getAttribute('href') ?? '';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  mailEmailPurifyHooksRegistered = true;
}
