import type { BrandMark } from './brand-mark';
import { IT_BRAND_HOSTS, IT_BRAND_LABELS, IT_BRAND_MARKS } from './it-brand-catalog';

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

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

/** Resolves a known IT brand mark from a personal-link URL, then label. */
export function resolveItBrandMark(url: string, label = ''): BrandMark | null {
  const host = hostnameFromUrl(url);
  if (host) {
    const fromHost = markForSlug(slugForHost(host));
    if (fromHost) return fromHost;
  }
  return markForSlug(IT_BRAND_LABELS[normalizeLabel(label)] ?? null);
}
