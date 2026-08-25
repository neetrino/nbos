import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { refreshBackendSession } from './auth/refresh-backend-session';
import { runSingleFlightRefresh } from './auth/refresh-registry';
import {
  copyBackendResponseHeaders,
  shouldForwardRequestHeaderToBackend,
} from './bff-backend-headers';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

/**
 * Proxies a browser API request to Nest, injecting the backend JWT from the
 * encrypted Auth.js session cookie (never exposed to client JavaScript).
 * On 401, performs a single-flight BFF refresh and retries once.
 */
export async function proxyToBackend(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const backendPath = pathSegments.join('/');
  const targetUrl = new URL(`${BACKEND_URL}/api/${backendPath}`);
  targetUrl.search = req.nextUrl.search;

  const bodyBuffer =
    req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined;

  const first = await forwardOnce(req, targetUrl, undefined, bodyBuffer);
  if (first.response.status !== 401) {
    return toNextResponse(first.response, first.setCookie);
  }

  const refreshed = await runSingleFlightRefresh(() => refreshBackendSession(req));
  if (!refreshed) {
    return toNextResponse(first.response);
  }

  const second = await forwardOnce(req, targetUrl, refreshed.accessToken, bodyBuffer);
  return toNextResponse(second.response, refreshed.setCookie);
}

async function forwardOnce(
  req: NextRequest,
  targetUrl: URL,
  accessTokenOverride: string | undefined,
  bodyBuffer: ArrayBuffer | undefined,
): Promise<{ response: Response; setCookie?: string }> {
  const sessionToken = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });
  const accessToken =
    accessTokenOverride ??
    (typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : undefined);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!shouldForwardRequestHeaderToBackend(key)) {
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
  if (bodyBuffer) {
    init.body = bodyBuffer;
  }

  try {
    const response = await fetch(targetUrl, init);
    return { response };
  } catch {
    return {
      response: Response.json(
        {
          statusCode: 503,
          message: 'Backend is temporarily unavailable. Try again shortly.',
          error: 'Service Unavailable',
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      ),
    };
  }
}

function toNextResponse(backendResponse: Response, setCookie?: string): NextResponse {
  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: copyBackendResponseHeaders(backendResponse, setCookie),
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
