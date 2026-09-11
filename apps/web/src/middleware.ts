/**
 * Auth gate at the Next.js request boundary.
 *
 * Next.js 16 prefers `proxy.ts`, but 16.2 Turbopack on this stack 404s real
 * App Router routes when that file is present — including `/api/auth/session`,
 * which then returns HTML and Auth.js throws ClientFetchError.
 * `middleware.ts` keeps the same `auth()` gate without that routing bug.
 */
import { auth } from '@/auth';
import { getAuthenticatedRootRedirect } from '@/lib/auth/authenticated-root-redirect';
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

export const middleware = auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const authenticatedRootRedirect = getAuthenticatedRootRedirect(pathname, Boolean(req.auth));
  if (authenticatedRootRedirect) {
    return NextResponse.redirect(new URL(authenticatedRootRedirect, req.nextUrl.origin));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const signInUrl = new URL('/sign-in', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Skip API handlers, static assets, and PWA manifest. Auth.js session
     * must return JSON; the manifest must not redirect to /sign-in.
     */
    '/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|webmanifest)$).*)',
  ],
};
