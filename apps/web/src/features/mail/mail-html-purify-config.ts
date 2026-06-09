import type { Config } from 'dompurify';

/** DOMPurify config for marketing/newsletter HTML emails (defense-in-depth after server sanitize). */
export const MAIL_HTML_PURIFY_CONFIG: Config = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ['center', 'font', 'mark', 'pre', 'code', 'thead', 'tbody'],
  ADD_ATTR: [
    'align',
    'alt',
    'background',
    'bgcolor',
    'border',
    'cellpadding',
    'cellspacing',
    'class',
    'color',
    'colspan',
    'face',
    'height',
    'href',
    'id',
    'rowspan',
    'size',
    'src',
    'style',
    'target',
    'title',
    'valign',
    'width',
  ],
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
  ],
};

/** Tailwind scope for isolated email HTML — preserves table layout and inline styles. */
export const MAIL_HTML_BODY_CLASS =
  'mail-html-body max-w-full overflow-x-auto break-words text-sm [&_a]:underline [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_table]:max-w-full';
