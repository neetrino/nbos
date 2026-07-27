import { ForbiddenException } from '@nestjs/common';
import { parseCorsOriginsFromEnv } from '../../security/cors-origins';
import { resolveRequestOrigin } from '../../security/request-origin';

/**
 * CSRF for cookie-based refresh (Variant A + BFF marker).
 * - Same-site browser: Origin/Referer must be in CORS allowlist.
 * - BFF server call: `X-Nbos-Bff: 1` with body refresh token (no cookie CSRF).
 * - Missing Origin without BFF marker and without body token → reject.
 */
export function assertRefreshCsrf(input: {
  origin?: string;
  referer?: string;
  bffHeader?: string;
  hasBodyToken: boolean;
}): void {
  const isBff = input.bffHeader === '1' || input.bffHeader === 'true';
  if (isBff && input.hasBodyToken) {
    return;
  }

  const allowed = new Set(parseCorsOriginsFromEnv());
  const resolved = resolveRequestOrigin(input.origin, input.referer);

  if (!resolved) {
    // Cookie-only refresh from a browser must send Origin/Referer.
    if (!input.hasBodyToken) {
      throw new ForbiddenException('Missing Origin');
    }
    // Non-browser clients may send body token without Origin (like legacy curl).
    return;
  }

  if (!allowed.has(resolved)) {
    throw new ForbiddenException('Origin not allowed');
  }
}
