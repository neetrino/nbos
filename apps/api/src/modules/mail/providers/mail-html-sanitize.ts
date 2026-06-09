const FORBIDDEN_TAG_RE =
  /<\s*\/?\s*(script|style|iframe|object|embed|form|input|button|link|meta|base)\b[^>]*>/gi;

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

function sanitizeInlineStyleValue(style: string): string {
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
      if (prop === 'position' || prop === 'z-index' || prop.includes('expression')) {
        return false;
      }
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join('; ');
}

function sanitizeStyleAttributes(html: string): string {
  return html.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (_match, _q, dbl, sgl) => {
    const raw = (dbl ?? sgl ?? '') as string;
    const cleaned = sanitizeInlineStyleValue(raw);
    return cleaned ? ` style="${cleaned}"` : '';
  });
}

function sanitizeClassAttributes(html: string): string {
  return html.replace(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, _q, dbl, sgl) => {
    const raw = (dbl ?? sgl ?? '') as string;
    if (/\bbxhtmled-code\b/.test(raw)) {
      return ' class="bxhtmled-code"';
    }
    return '';
  });
}

/**
 * Email HTML sanitizer: strips dangerous tags/attrs and allowlists inline styles
 * needed for compose formatting (fonts, colors, tables, alignment).
 */
export function sanitizeEmailHtml(html: string | null): string | null {
  if (!html) {
    return null;
  }
  let out = html
    .replace(FORBIDDEN_TAG_RE, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
  out = sanitizeStyleAttributes(out);
  out = sanitizeClassAttributes(out);
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
