import type { BrandMark } from './brand-mark';
import { IT_BRAND_HOSTS, IT_BRAND_LABELS, IT_BRAND_MARKS } from './it-brand-catalog';

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const LABEL_TOKEN_SPLIT = /[\s/_|:·,]+/;
const MIN_LABEL_TOKEN_LENGTH = 2;

function hostnameFromEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('://') || trimmed.includes(' ')) return null;
  const at = trimmed.lastIndexOf('@');
  if (at < 1 || at > trimmed.length - 4) return null;
  const domain = trimmed
    .slice(at + 1)
    .toLowerCase()
    .replace(/\.$/, '');
  if (!domain.includes('.')) return null;
  return domain.replace(/^www\./, '');
}

function hostnameFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('/')) return null;
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (!HTTP_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function hostnameFromHint(value: string): string | null {
  return hostnameFromEmail(value) ?? hostnameFromUrl(value);
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function slugForHost(hostname: string): string | null {
  let bestHost = '';
  let bestSlug: string | null = null;
  for (const [host, slug] of IT_BRAND_HOSTS) {
    const matches = hostname === host || hostname.endsWith(`.${host}`);
    if (!matches || host.length <= bestHost.length) continue;
    bestHost = host;
    bestSlug = slug;
  }
  return bestSlug;
}

function markForSlug(slug: string | null): BrandMark | null {
  if (!slug) return null;
  return IT_BRAND_MARKS[slug] ?? null;
}

function markFromToken(token: string): BrandMark | null {
  return markForSlug(IT_BRAND_LABELS[token] ?? null) ?? markForSlug(token);
}

function markFromLabelTokens(normalized: string): BrandMark | null {
  for (const token of normalized.split(LABEL_TOKEN_SPLIT)) {
    if (token.length < MIN_LABEL_TOKEN_LENGTH) continue;
    const mark = markFromToken(token);
    if (mark) return mark;
  }
  return null;
}

function markFromLabel(label: string): BrandMark | null {
  const normalized = normalizeLabel(label);
  if (!normalized) return null;
  const exact = markFromToken(normalized);
  if (exact) return exact;
  const compact = normalized.replace(/[\s._-]+/g, '');
  const fromCompact = markFromToken(compact);
  if (fromCompact) return fromCompact;
  return markFromLabelTokens(normalized);
}

function markFromHostHint(value: string): BrandMark | null {
  if (!value.trim()) return null;
  const host = hostnameFromHint(value);
  if (!host) return null;
  return markForSlug(slugForHost(host));
}

/** Resolves a known IT brand mark from a URL, email host, then label. Local catalog only. */
export function resolveItBrandMark(url: string, label = ''): BrandMark | null {
  return markFromHostHint(url) ?? markFromHostHint(label) ?? markFromLabel(label);
}

/** Tries each hint as a URL/email, then as a provider/name label. No network. */
export function resolveItBrandMarkFromHints(
  ...hints: Array<string | null | undefined>
): BrandMark | null {
  for (const hint of hints) {
    if (!hint?.trim()) continue;
    const fromUrl = resolveItBrandMark(hint, '');
    if (fromUrl) return fromUrl;
    const fromLabel = resolveItBrandMark('', hint);
    if (fromLabel) return fromLabel;
  }
  return null;
}
