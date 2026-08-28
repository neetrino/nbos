import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  isAccessTokenUsable,
  readAuthJsSessionToken,
  resolveAuthSessionKey,
} from './auth/authjs-session-token';
import { refreshBackendSession } from './auth/refresh-backend-session';
import { runSingleFlightRefresh } from './auth/refresh-registry';
import { SESSION_INVALID_HEADER, SESSION_INVALID_VALUE } from './auth/session-state';
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

  const sessionToken = await readAuthJsSessionToken(req);
  const accessToken =
    typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : undefined;

  const first = await forwardOnce(req, targetUrl, accessToken, bodyBuffer);
  if (first.response.status !== 401) {
    return toNextResponse(first.response);
  }

  // A usable access JWT from the trusted encrypted cookie means this is a
  // business/high-risk 401, not an expiry signal. Refreshing it would rotate
  // credentials unnecessarily and makes cross-replica response races unsafe.
  if (accessToken && isAccessTokenUsable(accessToken)) {
    return toNextResponse(first.response);
  }

  let refreshed;
  try {
    const sessionKey = resolveAuthSessionKey(sessionToken);
    refreshed = sessionKey
      ? await runSingleFlightRefresh(sessionKey, () => refreshBackendSession(req))
      : await refreshBackendSession(req);
  } catch {
    return temporaryRefreshFailure(503);
  }

  if (refreshed.kind === 'session-invalid') {
    return toNextResponse(first.response, undefined, true);
  }
  if (refreshed.kind === 'temporarily-unavailable') {
    return temporaryRefreshFailure(refreshed.status, refreshed.retryAfter);
  }

  const second = await forwardOnce(req, targetUrl, refreshed.accessToken, bodyBuffer);
  return toNextResponse(second.response, refreshed.setCookie);
}

async function forwardOnce(
  req: NextRequest,
  targetUrl: URL,
  accessToken: string | undefined,
  bodyBuffer: ArrayBuffer | undefined,
): Promise<{ response: Response }> {
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
    signal: req.signal,
  };
  if (bodyBuffer) {
    init.body = bodyBuffer;
  }

  try {
    const response = await fetch(targetUrl, init);
    return { response };
  } catch {
    if (req.signal.aborted) {
      return { response: new Response(null, { status: 499 }) };
    }
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

function toNextResponse(
  backendResponse: Response,
  setCookie?: string,
  sessionInvalid = false,
): NextResponse {
  const headers = copyBackendResponseHeaders(backendResponse, setCookie);
  if (sessionInvalid) {
    headers.set(SESSION_INVALID_HEADER, SESSION_INVALID_VALUE);
  }
  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}

function temporaryRefreshFailure(status: 429 | 503, retryAfter?: string): NextResponse {
  const response = NextResponse.json(
    {
      statusCode: status,
      message:
        status === 429
          ? 'Authentication refresh is rate limited. Try again shortly.'
          : 'Authentication service is temporarily unavailable. Try again shortly.',
      error: status === 429 ? 'Too Many Requests' : 'Service Unavailable',
      timestamp: new Date().toISOString(),
    },
    { status },
  );
  if (retryAfter) response.headers.set('Retry-After', retryAfter);
  return response;
}
