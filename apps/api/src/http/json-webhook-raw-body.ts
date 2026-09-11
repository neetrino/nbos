import type { IncomingMessage } from 'http';

/** Paths whose HMAC is computed over the exact JSON bytes Express parsed. */
export const JSON_WEBHOOK_RAW_BODY_PATHS = [
  '/api/integrations/meta/webhook',
  '/api/integrations/whatsapp-gateway/webhook',
] as const;

type RequestWithRawBody = IncomingMessage & {
  originalUrl?: string;
  url?: string;
  rawBody?: Buffer;
};

export function shouldCaptureJsonWebhookRawBody(requestUrl: string): boolean {
  return JSON_WEBHOOK_RAW_BODY_PATHS.some((path) => requestUrl.includes(path));
}

/** Copy parser bytes onto `req.rawBody`. Do not HMAC `JSON.stringify(parsedBody)`. */
export function captureJsonWebhookRawBody(req: IncomingMessage, buf: Buffer): void {
  const expressReq = req as RequestWithRawBody;
  const requestUrl = expressReq.originalUrl ?? expressReq.url ?? '';
  if (!shouldCaptureJsonWebhookRawBody(requestUrl)) return;
  expressReq.rawBody = Buffer.from(buf);
}
