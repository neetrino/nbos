import { describe, expect, it, vi } from 'vitest';
import { acquireMailIdleLock } from './mail-imap-idle.lock';

describe('IMAP IDLE lock', () => {
  it('prevents a second holder from acquiring the same mailbox lock', async () => {
    const store = new Map<string, string>();
    const redis = {
      set: vi.fn(async (key: string, value: string, ...args: Array<string | number>) => {
        const nx = args.includes('NX');
        if (nx && store.has(key)) {
          return null;
        }
        store.set(key, value);
        return 'OK';
      }),
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      del: vi.fn(async () => 1),
      expire: vi.fn(async () => 1),
    };

    const first = await acquireMailIdleLock(redis, 'acc-1', 'holder-a');
    const second = await acquireMailIdleLock(redis, 'acc-1', 'holder-b');

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(store.get('mail:idle:acc-1')).toBe('holder-a');
  });
});
