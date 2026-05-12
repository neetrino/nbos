/** When `URL` cannot yield a hostname, show this many chars (no I/O; synchronous). */
export const WORKBENCH_LINK_FALLBACK_PREFIX_CHARS = 20;

export function stripLeadingWwwFromHostname(hostname: string): string {
  return hostname.replace(/^www\./i, '');
}

/**
 * Compact label for link buttons: `youtube.com` style host, or truncated path after scheme.
 */
export function formatWorkbenchLinkDisplayLabel(href: string): string {
  const trimmed = href.trim();
  try {
    const { hostname } = new URL(trimmed);
    const host = stripLeadingWwwFromHostname(hostname);
    if (host) return host;
  } catch {
    // fall through to prefix
  }
  const withoutScheme = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const n = WORKBENCH_LINK_FALLBACK_PREFIX_CHARS;
  const slice = withoutScheme.slice(0, n);
  return slice.length < withoutScheme.length ? `${slice}…` : slice;
}
