import { shouldStripDecodedContentLength } from './bff-content-length';

/** Headers that must not be forwarded between hop and client. */
export const BFF_HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-encoding',
]);

export function shouldForwardRequestHeaderToBackend(name: string): boolean {
  const lower = name.toLowerCase();
  if (BFF_HOP_BY_HOP_HEADERS.has(lower)) return false;
  return lower !== 'authorization' && lower !== 'content-length';
}

export function copyBackendResponseHeaders(backend: Response, setCookie?: string): Headers {
  const stripLength = shouldStripDecodedContentLength(backend.headers.get('content-encoding'));
  const headers = new Headers();
  backend.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (BFF_HOP_BY_HOP_HEADERS.has(lower)) return;
    if (lower === 'content-length' && stripLength) return;
    headers.set(key, value);
  });
  if (setCookie) {
    headers.append('Set-Cookie', setCookie);
  }
  return headers;
}
