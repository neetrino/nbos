import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/** Monorepo root (apps/web → ../..). Turbopack must resolve `next` from the pnpm layout at the workspace root. */
const MONOREPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const API_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  outputFileTracingRoot: MONOREPO_ROOT,
  turbopack: {
    root: MONOREPO_ROOT,
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
          destination: '/favicon.svg',
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
