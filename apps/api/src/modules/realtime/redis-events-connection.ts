import Redis from 'ioredis';
import { getRedisUrl } from '../../common/redis/redis-connection';
import {
  createEventsPublisherConnection,
  createEventsSubscriberConnection,
} from '../../runtime/queue-redis';

/**
 * Redis URL for realtime Pub/Sub. Prefers `REDIS_EVENTS_URL`, falls back to `REDIS_URL`.
 * Returns undefined when neither is set (local single-process bus only).
 */
export function getRedisEventsUrl(): string | undefined {
  const events = process.env.REDIS_EVENTS_URL?.trim();
  if (events) return events;
  return getRedisUrl();
}

/** Dedicated publisher connection (never share with BullMQ workers). */
export function createRedisEventsPublisherConnection(url: string): Redis {
  return createEventsPublisherConnection(url);
}

/** Dedicated subscriber connection (never share with BullMQ workers). */
export function createRedisEventsSubscriberConnection(url: string): Redis {
  return createEventsSubscriberConnection(url);
}

/** @deprecated Prefer publisher/subscriber-specific factories. */
export function createRedisEventsConnection(url: string): Redis {
  return createEventsPublisherConnection(url);
}
