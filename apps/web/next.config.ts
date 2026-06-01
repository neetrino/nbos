import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/** Monorepo root (apps/web → ../..). Turbopack must resolve `next` from the pnpm layout at the workspace root. */
const MONOREPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const API_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy. `'unsafe-inline'` (scripts/styles) is required by
 * Next.js without per-request nonces; tightening to a nonce-based CSP is a
 * P1 follow-up. `'unsafe-eval'` and ws:/http: are dev-only (React Refresh, HMR).
 */
function buildContentSecurityPolicy(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(IS_DEV ? ["'unsafe-eval'"] : [])];
  const connectSrc = ["'self'", 'https:', 'wss:', ...(IS_DEV ? ['ws:', 'http:'] : [])];

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ];
  return directives.join('; ');
}

/** Baseline security headers applied to every response. */
function securityHeaders(): { key: string; value: string }[] {
  const headers = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
  ];
  // HSTS only in production: avoids pinning HTTPS on localhost during dev.
  if (!IS_DEV) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }
  return headers;
}

/** Hostnames from CORS_ORIGIN so LAN IP dev (e.g. 192.168.x.x) can load client JS/HMR. */
function parseAllowedDevOrigins(): string[] {
  const hosts = new Set<string>(['localhost', '127.0.0.1']);
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return [...hosts];

  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    try {
      hosts.add(new URL(trimmed).hostname);
    } catch {
      /* skip invalid entries */
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: MONOREPO_ROOT,
  allowedDevOrigins: parseAllowedDevOrigins(),
  turbopack: {
    root: MONOREPO_ROOT,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders(),
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      // afterFiles runs AFTER Next.js file-system routes are checked.
      // This means /api/auth/* is served by NextAuth (apps/web/src/app/api/auth/[...nextauth]/route.ts)
      // before the rewrite rule is evaluated — no conflict.
      afterFiles: [
        {
          source: '/favicon.ico',
          destination: '/logo/icon.png',
        },
        {
          // Exclude Auth.js routes from backend proxying.
          // Otherwise /api/auth/* gets forwarded to Nest and breaks session parsing in the client.
          source: '/api/:path((?!auth(?:/|$)).*)',
          destination: `${API_URL}/api/:path`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
