import { describe, expect, it } from 'vitest';
import {
  AGENT_RATE_LIMIT_WINDOW_MS,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';
import { AGENT_RATE_LIMIT_INCR_LUA, agentRateLimitWindowKey } from './agent-rate-limit.redis-keys';
import {
  RedisAgentRateLimitStore,
  type AgentRateLimitRedisClient,
} from './agent-rate-limit.redis-store';

const NOW = 1_700_000_000_000;
const AGENT = 'agent-shared';

function createFakeRedis(): AgentRateLimitRedisClient & { values: Map<string, number> } {
  const values = new Map<string, number>();
  return {
    values,
    async eval(script: string, _numKeys: number, key: string, ...args: (string | number)[]) {
      const current = (values.get(String(key)) ?? 0) + 1;
      const limit = Number(args[0]);
      if (script === AGENT_RATE_LIMIT_INCR_LUA) {
        values.set(String(key), current);
        return current;
      }
      if (current > limit) {
        return -1;
      }
      values.set(String(key), current);
      return current;
    },
    async get(key: string) {
      const value = values.get(key);
      return value === undefined ? null : String(value);
    },
    async decr(key: string) {
      const next = Math.max(0, (values.get(key) ?? 0) - 1);
      values.set(key, next);
      return next;
    },
  };
}

describe('RedisAgentRateLimitStore', () => {
  it('shares one window across callers (multi-instance)', async () => {
    const redis = createFakeRedis();
    const first = new RedisAgentRateLimitStore(redis);
    const second = new RedisAgentRateLimitStore(redis);
    const limit = 2;

    expect(
      (await first.consumeWindow('req', AGENT, limit, AGENT_RATE_LIMIT_WINDOW_MS, NOW)).allowed,
    ).toBe(true);
    expect(
      (await first.consumeWindow('req', AGENT, limit, AGENT_RATE_LIMIT_WINDOW_MS, NOW)).allowed,
    ).toBe(true);
    expect(
      (await second.consumeWindow('req', AGENT, limit, AGENT_RATE_LIMIT_WINDOW_MS, NOW)).allowed,
    ).toBe(false);
  });

  it('fails closed when Redis is unavailable', async () => {
    const store = new RedisAgentRateLimitStore({
      eval: async () => {
        throw new Error('redis down');
      },
      get: async () => {
        throw new Error('redis down');
      },
      decr: async () => {
        throw new Error('redis down');
      },
    });

    expect(
      (
        await store.consumeWindow(
          'req',
          AGENT,
          AGENT_REQUEST_LIMIT_PER_WINDOW,
          AGENT_RATE_LIMIT_WINDOW_MS,
          NOW,
        )
      ).allowed,
    ).toBe(false);
  });

  it('names keys by window bucket so instances cannot fork the ceiling', () => {
    const key = agentRateLimitWindowKey('req', AGENT, NOW, AGENT_RATE_LIMIT_WINDOW_MS);
    expect(key).toContain('nbos:ai:rl:req:');
    expect(key).toContain(AGENT);
  });
});
