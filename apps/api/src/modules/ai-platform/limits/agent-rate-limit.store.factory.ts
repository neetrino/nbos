import { Logger } from '@nestjs/common';
import { createStateRedisConnection, getRedisStateUrl } from '../../../runtime/queue-redis';
import { MemoryAgentRateLimitStore } from './agent-rate-limit.memory-store';
import { RedisAgentRateLimitStore } from './agent-rate-limit.redis-store';
import type { AgentRateLimitStore } from './agent-rate-limit.store';

const logger = new Logger('AgentRateLimitStoreFactory');

export function createAgentRateLimitStore(): AgentRateLimitStore {
  if (process.env.VITEST && process.env.AI_RATE_LIMIT_REDIS_IN_TEST !== '1') {
    return new MemoryAgentRateLimitStore();
  }
  const url = getRedisStateUrl();
  if (!url) {
    logger.warn('REDIS_STATE_URL/REDIS_URL unset — agent rate limits use in-memory storage');
    return new MemoryAgentRateLimitStore();
  }
  logger.log('Agent rate limits backed by Redis');
  return new RedisAgentRateLimitStore(createStateRedisConnection(url));
}
