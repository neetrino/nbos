import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';
const HEALTH_PATH = '/api/health';

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
];

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
