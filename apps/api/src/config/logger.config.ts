import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { stdSerializers } from 'pino';

const REQUEST_ID_HEADER = 'x-request-id';
const HEALTH_PATH = '/api/health';

const SENSITIVE_QUERY_PARAMS = ['code', 'state', 'access_token', 'client_secret'] as const;

/**
 * Fields scrubbed from logs. Headers are always serialized by pino-http; body
 * paths are defensive in case a custom serializer is added later.
 */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-scheduler-key"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.client_secret',
  'req.body.access_token',
];

/** Redacts OAuth and token query params from logged request URLs. */
export function sanitizeLoggedRequestUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url;
  }
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return url;
  }

  const path = url.slice(0, queryIndex);
  const params = new URLSearchParams(url.slice(queryIndex + 1));
  let changed = false;

  for (const key of SENSITIVE_QUERY_PARAMS) {
    if (!params.has(key)) {
      continue;
    }
    params.set(key, '[REDACTED]');
    changed = true;
  }

  if (!changed) {
    return url;
  }

  const sanitizedQuery = params.toString();
  return sanitizedQuery.length > 0 ? `${path}?${sanitizedQuery}` : path;
}

/** Redacts OAuth and token values from logged request query objects without mutating input. */
export function sanitizeLoggedQuery(
  query: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!query) {
    return query;
  }

  let changed = false;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query)) {
    if ((SENSITIVE_QUERY_PARAMS as readonly string[]).includes(key)) {
      sanitized[key] = '[REDACTED]';
      changed = true;
      continue;
    }
    sanitized[key] = value;
  }

  return changed ? sanitized : query;
}

type IncomingMessageWithQuery = IncomingMessage & { query?: Record<string, unknown> };

function serializeRequest(req: IncomingMessage): Record<string, unknown> {
  const serialized = stdSerializers.req(req);
  const url = 'url' in serialized ? (serialized.url as string | undefined) : undefined;
  const expressQuery = (req as IncomingMessageWithQuery).query;
  const serializedQuery =
    'query' in serialized ? (serialized.query as Record<string, unknown> | undefined) : undefined;
  const query = sanitizeLoggedQuery(serializedQuery ?? expressQuery);
  return {
    ...serialized,
    url: sanitizeLoggedRequestUrl(url),
    ...(query !== undefined ? { query } : {}),
  };
}

/** nestjs-pino params: JSON logs + per-request id + secret redaction (pretty in dev). */
export function buildLoggerParams(): Params {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const header = req.headers[REQUEST_ID_HEADER];
        const id = (Array.isArray(header) ? header[0] : header) || randomUUID();
        res.setHeader(REQUEST_ID_HEADER, id);
        return id;
      },
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
      serializers: {
        req: serializeRequest,
      },
      autoLogging: {
        // Skip Render/uptime health pings to keep logs signal-rich.
        ignore: (req: IncomingMessage) => req.url === HEALTH_PATH,
      },
      ...(isProduction
        ? {}
        : { transport: { target: 'pino-pretty', options: { singleLine: true } } }),
    },
  };
}
