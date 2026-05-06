import helmet from 'helmet';

/**
 * JSON API: disable CSP on responses (not HTML); allow cross-origin reads when CORS allowlist is used.
 */
export function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
}
