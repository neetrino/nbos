import type { NextRequest } from 'next/server';
import { getBackendAccessToken } from '@/lib/bff-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

/**
 * Dedicated SSE proxy: browser EventSource cannot set Authorization headers.
 * Session cookie → Nest Bearer, stream body without buffering into memory.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const accessToken = await getBackendAccessToken(req);
  if (!accessToken) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUrl = `${BACKEND_URL}/api/realtime/calls`;
  const abort = new AbortController();
  req.signal.addEventListener('abort', () => {
    abort.abort();
  });

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: abort.signal,
      cache: 'no-store',
    });
  } catch {
    if (abort.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    return new Response(JSON.stringify({ message: 'Backend unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!backendResponse.ok || !backendResponse.body) {
    const text = await backendResponse.text().catch(() => '');
    return new Response(text || JSON.stringify({ message: 'Realtime unavailable' }), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('Connection', 'keep-alive');
  headers.set('X-Accel-Buffering', 'no');

  return new Response(backendResponse.body, {
    status: 200,
    headers,
  });
}
