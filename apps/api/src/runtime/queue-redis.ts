import Redis from 'ioredis';
import { getRedisUrl } from '../common/redis/redis-connection';

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
  return new Redis(url, {
    ...SKIP_READY_CHECK,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
}

/** BullMQ Worker blocking connection. */
export function createQueueWorkerConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_QUEUE_URL / REDIS_URL');
  return new Redis(url, {
    ...SKIP_READY_CHECK,
    maxRetriesPerRequest: null,
  });
}

/** Optional QueueEvents connection (same options as producer). */
export function createQueueEventsConnection(url: string): Redis {
  return createQueueProducerConnection(url);
}

/** State cache (denylist, vault) — non-blocking. */
export function createStateRedisConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_STATE_URL / REDIS_URL');
  return new Redis(url, {
    ...SKIP_READY_CHECK,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
}

/** Realtime Pub/Sub publisher. */
export function createEventsPublisherConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_EVENTS_URL / REDIS_URL');
  return new Redis(url, {
    ...SKIP_READY_CHECK,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
}

/** Realtime Pub/Sub subscriber (blocking-friendly). */
export function createEventsSubscriberConnection(url: string): Redis {
  assertTlsInProduction(url, 'REDIS_EVENTS_URL / REDIS_URL');
  return new Redis(url, {
    ...SKIP_READY_CHECK,
    maxRetriesPerRequest: null,
  });
}
