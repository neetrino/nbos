export interface SrcLookupCookies {
  cookieHeader: string;
  csrfToken: string;
}

function splitCookiePair(segment: string): [string, string] | null {
  const separator = segment.indexOf('=');
  if (separator <= 0) return null;
  const name = segment.slice(0, separator).trim();
  const value = segment.slice(separator + 1).trim();
  if (!name || !value) return null;
  return [name, value];
}

export function parseSrcSetCookieHeaders(headers: readonly string[]): SrcLookupCookies | null {
  const cookies = new Map<string, string>();
  for (const header of headers) {
    const first = header.split(';', 1)[0];
    if (!first) continue;
    const pair = splitCookiePair(first);
    if (pair) cookies.set(pair[0], pair[1]);
  }
  const xsrf = cookies.get('XSRF-TOKEN');
  const session = cookies.get('laravel_session');
  if (!xsrf || !session) return null;
  return {
    cookieHeader: `XSRF-TOKEN=${xsrf}; laravel_session=${session}`,
    csrfToken: decodeURIComponent(xsrf),
  };
}
