import Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../../common/redis/redis-connection';

/**
 * Redis URL for realtime Pub/Sub. Prefers `REDIS_EVENTS_URL`, falls back to `REDIS_URL`.
 * Returns undefined when neither is set (local single-process bus only).
 */
export function getRedisEventsUrl(): string | undefined {
  const events = process.env.REDIS_EVENTS_URL?.trim();
  if (events) return events;
  return getRedisUrl();
}

/** Dedicated publisher/subscriber connections (never share with BullMQ workers). */
export function createRedisEventsConnection(url: string): Redis {
  return createRedisConnection(url);
}
