const SLUG_FALLBACK = 'item';
const DEFAULT_MAX_LEN = 48;

/**
 * Lowercase URL-safe segment for R2 path folders (not full Unicode transliteration).
 */
export function slugifySegment(value: string, maxLen = DEFAULT_MAX_LEN): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const slug = normalized
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const out = (slug.length > 0 ? slug : SLUG_FALLBACK).slice(0, maxLen);
  return out.length > 0 ? out : SLUG_FALLBACK;
}
