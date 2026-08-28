import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import {
  copyBackendResponseHeaders,
  shouldForwardRequestHeaderToBackend,
} from './bff-backend-headers';

describe('BFF recording proxy headers', () => {
  it('forwards Range to the backend and keeps hop-by-hop headers out', () => {
    expect(shouldForwardRequestHeaderToBackend('Range')).toBe(true);
    expect(shouldForwardRequestHeaderToBackend('range')).toBe(true);
    expect(shouldForwardRequestHeaderToBackend('Host')).toBe(false);
    expect(shouldForwardRequestHeaderToBackend('Authorization')).toBe(false);
    expect(shouldForwardRequestHeaderToBackend('Content-Length')).toBe(false);
    expect(shouldForwardRequestHeaderToBackend('Cookie')).toBe(false);
  });

  it('strips the reserved session-invalid header from backend responses', () => {
    const backend = new Response(null, {
      status: 401,
      headers: { 'X-Nbos-Session-Invalid': '1' },
    });
    expect(copyBackendResponseHeaders(backend).has('X-Nbos-Session-Invalid')).toBe(false);
  });

  it('preserves 206, Content-Range, Content-Length, and the body bytes', async () => {
    const payload = new Uint8Array([1, 2, 3]);
    const backend = new Response(payload, {
      status: 206,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': '3',
        'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes 0-2/34776',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
      },
    });
    const proxied = new NextResponse(backend.body, {
      status: backend.status,
      headers: copyBackendResponseHeaders(backend),
    });
    expect(proxied.status).toBe(206);
    expect(proxied.headers.get('Content-Range')).toBe('bytes 0-2/34776');
    expect(proxied.headers.get('Content-Length')).toBe('3');
    expect(proxied.headers.get('Accept-Ranges')).toBe('bytes');
    expect(proxied.headers.get('Cache-Control')).toBe('private, no-store');
    expect(Array.from(new Uint8Array(await proxied.arrayBuffer()))).toEqual([1, 2, 3]);
  });

  it('preserves 416 Content-Range without inventing a body', async () => {
    const backend = new Response(null, {
      status: 416,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes */34776',
        'Cache-Control': 'private, no-store',
      },
    });
    const headers = copyBackendResponseHeaders(backend);
    expect(headers.get('Content-Range')).toBe('bytes */34776');
    expect(headers.get('Content-Length')).toBeNull();
  });

  it('strips Content-Length only after gzip decode', () => {
    const gzip = new Response('ok', {
      headers: { 'Content-Encoding': 'gzip', 'Content-Length': '2' },
    });
    expect(copyBackendResponseHeaders(gzip).has('Content-Length')).toBe(false);
    const identity = new Response('ok', {
      headers: { 'Content-Length': '34776', 'Content-Type': 'audio/mpeg' },
    });
    expect(copyBackendResponseHeaders(identity).get('Content-Length')).toBe('34776');
  });
});
