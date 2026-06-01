import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

/** Headers that must not be forwarded between hop and client. */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

/**
 * Proxies a browser API request to Nest, injecting the backend JWT from the
 * encrypted Auth.js session cookie (never exposed to client JavaScript).
 */
export async function proxyToBackend(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const backendPath = pathSegments.join('/');
  const targetUrl = new URL(`${BACKEND_URL}/api/${backendPath}`);
  targetUrl.search = req.nextUrl.search;

  const sessionToken = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });
  const accessToken =
    typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : undefined;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower) || lower === 'authorization') {
      return;
    }
    headers.set(key, value);
  });

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const backendResponse = await fetch(targetUrl, init);

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      return;
    }
    responseHeaders.set(key, value);
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

/** Reads the backend access token from the encrypted session cookie (server-only). */
export async function getBackendAccessToken(req: NextRequest): Promise<string | null> {
  const sessionToken = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });
  return typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : null;
}
