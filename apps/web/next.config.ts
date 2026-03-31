import type { NextConfig } from 'next';

const API_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
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
