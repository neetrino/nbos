import Redis from 'ioredis';

/** BullMQ requires `maxRetriesPerRequest: null` on its connections. */
const REDIS_CONNECTION_OPTIONS = { maxRetriesPerRequest: null } as const;

/** Returns a trimmed `REDIS_URL` or `undefined` when unset/blank. */
export function getRedisUrl(): string | undefined {
  const url = process.env.REDIS_URL?.trim();
  return url ? url : undefined;
}

/**
 * Creates an ioredis connection, enforcing TLS (`rediss://`) in production so
 * queue traffic (job payloads) is never sent in clear text.
 */
export function createRedisConnection(url: string): Redis {
  if (process.env.NODE_ENV === 'production' && !url.startsWith('rediss://')) {
    throw new Error('REDIS_URL must use TLS (rediss://) in production.');
  }
  return new Redis(url, REDIS_CONNECTION_OPTIONS);
}
