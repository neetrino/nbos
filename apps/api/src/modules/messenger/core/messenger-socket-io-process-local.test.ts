import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveSocketIoFanout } from '../../../socket-io-fanout';

const baseEnv = { NODE_ENV: 'test' } as NodeJS.ProcessEnv;

describe('Socket.IO fan-out selection', () => {
  it('stays process-local only for local all when Redis is unset', () => {
    expect(resolveSocketIoFanout({ ...baseEnv, PROCESS_ROLE: 'all' })).toEqual({
      mode: 'process-local',
    });
    expect(resolveSocketIoFanout({ ...baseEnv, PROCESS_ROLE: 'all', REDIS_URL: '  ' })).toEqual({
      mode: 'process-local',
    });
  });

  it('selects Redis from REDIS_EVENTS_URL, then REDIS_URL', () => {
    expect(
      resolveSocketIoFanout({
        ...baseEnv,
        PROCESS_ROLE: 'api',
        REDIS_EVENTS_URL: 'redis://events:6379',
        REDIS_URL: 'redis://shared:6379',
      }),
    ).toEqual({ mode: 'redis', url: 'redis://events:6379' });
    expect(
      resolveSocketIoFanout({
        ...baseEnv,
        PROCESS_ROLE: 'all',
        REDIS_URL: 'redis://shared:6379',
      }),
    ).toEqual({ mode: 'redis', url: 'redis://shared:6379' });
  });

  it('refuses api, worker, and scheduler when Redis is unset', () => {
    for (const role of ['api', 'worker', 'scheduler'] as const) {
      const decision = resolveSocketIoFanout({ ...baseEnv, PROCESS_ROLE: role });
      expect(decision.mode).toBe('refused');
      if (decision.mode === 'refused') expect(decision.reason).toContain(role);
    }
  });

  it('keeps CORS and installs the Redis adapter from API bootstrap', () => {
    const adapter = readFileSync(new URL('../../../socket-io.adapter.ts', import.meta.url), 'utf8');
    const main = readFileSync(new URL('../../../main.ts', import.meta.url), 'utf8');
    expect(adapter).toMatch(/credentials: true/);
    expect(adapter).toMatch(/parseCorsOriginsFromEnv/);
    expect(adapter).toMatch(/createAdapter/);
    expect(adapter).toMatch(/createRedisEventsPublisherConnection/);
    expect(main).toMatch(/installMessengerSocketIoAdapter/);
    expect(main).not.toMatch(/useWebSocketAdapter\(new SocketIoCorsAdapter/);
  });
});
