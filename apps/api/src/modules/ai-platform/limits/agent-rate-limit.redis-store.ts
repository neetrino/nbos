import { Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import {
  AGENT_CONCURRENCY_SLOT_TTL_MS,
  AGENT_RATE_LIMIT_ACQUIRE_LUA,
  AGENT_RATE_LIMIT_INCR_LUA,
  agentConcurrencyRedisKey,
  agentRateLimitWindowKey,
  concurrencyDenied,
  decisionFromCount,
} from './agent-rate-limit.redis-keys';
import type { AgentRateLimitStore, AgentRateLimitWindowKind } from './agent-rate-limit.store';
import type { AgentRateLimitDecision } from './agent-rate-limit.window';

export interface AgentRateLimitRedisClient {
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
  get(key: string): Promise<string | null>;
  decr(key: string): Promise<number>;
  quit?(): Promise<unknown>;
}

/**
 * Shared fixed-window counters. Every API instance charges the same keys, so
 * N replicas cannot multiply the External Agent ceiling.
 *
 * Redis errors fail closed: a degraded store refuses rather than opening the
 * namespace. Slot release failures are logged; the concurrency TTL recovers.
 */
export class RedisAgentRateLimitStore implements AgentRateLimitStore {
  private readonly logger = new Logger(RedisAgentRateLimitStore.name);

  constructor(private readonly redis: AgentRateLimitRedisClient) {}

  async consumeWindow(
    kind: AgentRateLimitWindowKind,
    id: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<AgentRateLimitDecision> {
    const key = agentRateLimitWindowKey(kind, id, now, windowMs);
    try {
      const used = await this.evalNumber(AGENT_RATE_LIMIT_INCR_LUA, key, windowMs);
      return decisionFromCount(used, limit, now, windowMs, 'consumed');
    } catch (error) {
      this.logger.error(`Rate-limit window failed: ${String(error)}`);
      return decisionFromCount(limit + 1, limit, now, windowMs, 'consumed');
    }
  }

  async peekWindow(
    kind: AgentRateLimitWindowKind,
    id: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<AgentRateLimitDecision> {
    const key = agentRateLimitWindowKey(kind, id, now, windowMs);
    try {
      const raw = await this.redis.get(key);
      const used = raw ? Number(raw) : 0;
      return decisionFromCount(Number.isFinite(used) ? used : 0, limit, now, windowMs, 'peek');
    } catch (error) {
      this.logger.error(`Rate-limit peek failed: ${String(error)}`);
      return decisionFromCount(limit + 1, limit, now, windowMs, 'peek');
    }
  }

  async acquireSlot(agentId: string, limit: number, now: number): Promise<AgentRateLimitDecision> {
    const key = agentConcurrencyRedisKey(agentId);
    try {
      const used = await this.evalNumber(
        AGENT_RATE_LIMIT_ACQUIRE_LUA,
        key,
        limit,
        AGENT_CONCURRENCY_SLOT_TTL_MS,
      );
      if (used < 0) {
        return concurrencyDenied(limit, now);
      }
      return {
        allowed: true,
        limit,
        remaining: limit - used,
        resetAt: now + AGENT_CONCURRENCY_SLOT_TTL_MS,
        retryAfterSeconds: 0,
      };
    } catch (error) {
      this.logger.error(`Rate-limit slot acquire failed: ${String(error)}`);
      return concurrencyDenied(limit, now);
    }
  }

  async releaseSlot(agentId: string): Promise<void> {
    try {
      await this.redis.decr(agentConcurrencyRedisKey(agentId));
    } catch (error) {
      this.logger.error(`Rate-limit slot release failed: ${String(error)}`);
    }
  }

  async close(): Promise<void> {
    await this.redis.quit?.();
  }

  private async evalNumber(script: string, key: string, ...args: number[]): Promise<number> {
    const result = await this.redis.eval(script, 1, key, ...args);
    const value = Number(result);
    if (!Number.isFinite(value)) {
      throw new Error('Redis rate-limit script returned a non-number');
    }
    return value;
  }
}

export function asAgentRateLimitRedis(redis: Redis): AgentRateLimitRedisClient {
  return redis;
}
