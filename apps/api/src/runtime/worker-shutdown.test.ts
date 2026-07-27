import { afterEach, describe, expect, it, vi } from 'vitest';
import { runGracefulShutdown } from './worker-shutdown';

describe('worker-shutdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs steps in order', async () => {
    const order: string[] = [];
    const ok = await runGracefulShutdown(
      [
        {
          name: 'a',
          run: async () => {
            order.push('a');
          },
        },
        {
          name: 'b',
          run: async () => {
            order.push('b');
          },
        },
      ],
      { log: () => undefined, timeoutMs: 5_000 },
    );
    expect(ok).toBe(true);
    expect(order).toEqual(['a', 'b']);
  });

  it('is safe to run empty steps twice', async () => {
    const log = vi.fn();
    expect(await runGracefulShutdown([], { log, timeoutMs: 1_000 })).toBe(true);
    expect(await runGracefulShutdown([], { log, timeoutMs: 1_000 })).toBe(true);
  });
});
