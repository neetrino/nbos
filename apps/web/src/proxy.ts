/**
 * Next.js 16+ network boundary: `src/proxy.ts` replaces the deprecated `middleware.ts` file.
 * This file is loaded by the framework; do not import it from app code.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
import { getAuthenticatedRootRedirect } from '@/lib/auth/authenticated-root-redirect';
import { readAuthJsSessionToken } from '@/lib/auth/authjs-session-token';
import { persistRotatedAccessCookie } from '@/lib/auth/persist-rotated-access-cookie';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/accept-invite',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/data-deletion',
];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true;
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Auth-aware proxy: named export `proxy` is the convention expected by Next.js.
 *
 * The incoming session cookie is never re-signed. A usable access JWT is left alone.
 * When access is expired, the existing BFF helper may persist a freshly rotated cookie
 * so RSC can read preferences without inventing a second refresh mechanism.
 */
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const sessionToken = await readAuthJsSessionToken(req);
  const isAuthenticated = sessionToken !== null;

  const authenticatedRootRedirect = getAuthenticatedRootRedirect(pathname, isAuthenticated);
  if (authenticatedRootRedirect) {
    return NextResponse.redirect(new URL(authenticatedRootRedirect, req.nextUrl.origin));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const signInUrl = new URL('/sign-in', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  await persistRotatedAccessCookie(req, sessionToken, response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Skip API handlers, static assets, and PWA manifest. Auth.js session
     * must return JSON; the manifest must not redirect to /sign-in.
     */
    '/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|webmanifest)$).*)',
  ],
};
