import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Dedicated SSE proxy: browser EventSource cannot set Authorization headers.
 * The shared BFF refreshes an expired access token before returning the stream.
 */
export async function GET(req: NextRequest): Promise<Response> {
  return proxyToBackend(req, ['realtime', 'calls']);
}
