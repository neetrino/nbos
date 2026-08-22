import {
  AGENT_CONCURRENCY_RETRY_HINT_MS,
  AGENT_RATE_LIMIT_WINDOW_MS,
} from './agent-rate-limit.constants';
import {
  AGENT_RATE_LIMIT_REDIS_PREFIX,
  type AgentRateLimitWindowKind,
} from './agent-rate-limit.store';
import { retryAfterSecondsUntil, type AgentRateLimitDecision } from './agent-rate-limit.window';

/** Safety TTL so a crashed process cannot pin an in-flight slot forever. */
export const AGENT_CONCURRENCY_SLOT_TTL_MS = 5 * 60 * 1_000;

/**
 * INCR + PEXPIRE for a fixed window. First increment owns the TTL.
 */
export const AGENT_RATE_LIMIT_INCR_LUA = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return n
`;

export const AGENT_RATE_LIMIT_ACQUIRE_LUA = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[2]))
end
if n > tonumber(ARGV[1]) then
  redis.call('DECR', KEYS[1])
  return -1
end
return n
`;

export function agentRateLimitWindowKey(
  kind: AgentRateLimitWindowKind,
  id: string,
  now: number,
  windowMs: number,
): string {
  const bucket = Math.floor(now / windowMs);
  return `${AGENT_RATE_LIMIT_REDIS_PREFIX}${kind}:${id}:${bucket}`;
}

export function agentConcurrencyRedisKey(agentId: string): string {
  return `${AGENT_RATE_LIMIT_REDIS_PREFIX}conc:${agentId}`;
}

export function decisionFromCount(
  used: number,
  limit: number,
  now: number,
  windowMs: number,
  mode: 'consumed' | 'peek',
): AgentRateLimitDecision {
  const windowStartedAt = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStartedAt + windowMs;
  const exceeded = mode === 'peek' ? used >= limit : used > limit;
  if (exceeded) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds: retryAfterSecondsUntil(resetAt, now),
    };
  }
  return {
    allowed: true,
    limit,
    remaining: limit - used,
    resetAt,
    retryAfterSeconds: 0,
  };
}

export function concurrencyDenied(limit: number, now: number): AgentRateLimitDecision {
  return {
    allowed: false,
    limit,
    remaining: 0,
    resetAt: now + AGENT_RATE_LIMIT_WINDOW_MS,
    retryAfterSeconds: retryAfterSecondsUntil(now + AGENT_CONCURRENCY_RETRY_HINT_MS, now),
  };
}
