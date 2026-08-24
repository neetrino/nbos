import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisUrl } from '../common/redis/redis-connection';

const redisLogger = new Logger('RedisConnection');
const redisClosePromises = new WeakMap<object, Promise<void>>();

function assertTlsInProduction(url: string, label: string): void {
  if (process.env.NODE_ENV === 'production' && !url.startsWith('rediss://')) {
    throw new Error(`${label} must use TLS (rediss://) in production.`);
  }
}

/** Queue Redis: REDIS_QUEUE_URL → REDIS_URL. */
export function getRedisQueueUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const dedicated = env.REDIS_QUEUE_URL?.trim();
  if (dedicated) return dedicated;
  return getRedisUrl();
}

/** State / cache Redis: REDIS_STATE_URL → REDIS_URL. */
export function getRedisStateUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const dedicated = env.REDIS_STATE_URL?.trim();
  if (dedicated) return dedicated;
  return getRedisUrl();
}

/** Events Pub/Sub: REDIS_EVENTS_URL → REDIS_URL (also in realtime helper). */
export function getRedisEventsUrlResolved(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const dedicated = env.REDIS_EVENTS_URL?.trim();
  if (dedicated) return dedicated;
  return getRedisUrl();
}

export type RedisTopologySummary = {
  queue: 'dedicated' | 'shared fallback' | 'unset';
  state: 'dedicated' | 'shared fallback' | 'unset';
  events: 'dedicated' | 'shared fallback' | 'unset';
};

export function summarizeRedisTopology(env: NodeJS.ProcessEnv = process.env): RedisTopologySummary {
  const base = Boolean(env.REDIS_URL?.trim());
  return {
    queue: env.REDIS_QUEUE_URL?.trim() ? 'dedicated' : base ? 'shared fallback' : 'unset',
    state: env.REDIS_STATE_URL?.trim() ? 'dedicated' : base ? 'shared fallback' : 'unset',
    events: env.REDIS_EVENTS_URL?.trim() ? 'dedicated' : base ? 'shared fallback' : 'unset',
  };
}

export function logRedisTopology(log: (message: string) => void, env = process.env): void {
  const t = summarizeRedisTopology(env);
  log(`Queue Redis: ${t.queue}`);
  log(`State Redis: ${t.state}`);
  log(`Events Redis: ${t.events}`);
}

/**
 * Skip ioredis INFO ready-check. On Upstash every INFO is a billed command
 * and reconnect storms multiply it.
 */
const SKIP_READY_CHECK = { enableReadyCheck: false } as const;

/** BullMQ producer / Queue client — non-blocking. */
export function createQueueProducerConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_QUEUE_URL / REDIS_URL');
  return guardRedisConnection(
    new Redis(url, {
      ...SKIP_READY_CHECK,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    }),
    'queue-producer',
  );
}

/** BullMQ Worker blocking connection. */
export function createQueueWorkerConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_QUEUE_URL / REDIS_URL');
  return guardRedisConnection(
    new Redis(url, {
      ...SKIP_READY_CHECK,
      maxRetriesPerRequest: null,
    }),
    'queue-worker',
  );
}

/** Optional QueueEvents connection (same options as producer). */
export function createQueueEventsConnection(url: string): Redis {
  return createQueueProducerConnection(url);
}

/** State cache (denylist, vault) — non-blocking. */
export function createStateRedisConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_STATE_URL / REDIS_URL');
  return guardRedisConnection(
    new Redis(url, {
      ...SKIP_READY_CHECK,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    }),
    'state',
  );
}

/** Realtime Pub/Sub publisher. */
export function createEventsPublisherConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_EVENTS_URL / REDIS_URL');
  return guardRedisConnection(
    new Redis(url, {
      ...SKIP_READY_CHECK,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    }),
    'events-publisher',
  );
}

/** Realtime Pub/Sub subscriber (blocking-friendly). */
export function createEventsSubscriberConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_EVENTS_URL / REDIS_URL');
  return guardRedisConnection(
    new Redis(url, {
      ...SKIP_READY_CHECK,
      maxRetriesPerRequest: null,
    }),
    'events-subscriber',
  );
}

/** Idempotent shutdown for owned ioredis clients, including already-closed sockets. */
export function closeRedisConnection(
  connection: Pick<Redis, 'quit' | 'disconnect' | 'status'> | null | undefined,
): Promise<void> {
  if (!connection) return Promise.resolve();
  const key = connection as object;
  const existing = redisClosePromises.get(key);
  if (existing) return existing;

  const closing = (async () => {
    if (connection.status === 'end') return;
    try {
      await connection.quit();
    } catch (error) {
      if (isRedisConnectionClosedError(error)) return;
      connection.disconnect(false);
      throw error;
    }
  })();
  redisClosePromises.set(key, closing);
  return closing;
}

export function isRedisConnectionClosedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection is closed|connection already closed|stream isn't writeable/i.test(message);
}

function guardRedisConnection(connection: Redis, label: string): Redis {
  connection.on('error', (error) => {
    const code = readRedisErrorCode(error);
    const message = redactRedisError(error instanceof Error ? error.message : String(error));
    const detail = `${label} error code=${code ?? 'UNKNOWN'} message=${message}`;
    if (isRedisConnectionClosedError(error)) {
      redisLogger.debug(detail);
    } else {
      redisLogger.warn(detail);
    }
  });
  return connection;
}

function readRedisErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return code === undefined || code === null ? undefined : String(code);
}

function redactRedisError(message: string): string {
  return message.replace(/\bredis(?:s)?:\/\/\S+/gi, '[redacted-url]');
}
