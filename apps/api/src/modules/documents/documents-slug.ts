const SLUG_MAX = 80;

/**
 * URL-safe slug from a human title (ASCII fallback).
 */
export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX);
  return base.length > 0 ? base : 'document';
}
