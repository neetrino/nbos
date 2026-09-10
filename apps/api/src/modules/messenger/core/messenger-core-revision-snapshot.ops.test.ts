import { beforeEach, describe, expect, it, vi } from 'vitest';
import { snapshotMessengerZoneRead } from './messenger-core-revision-snapshot.ops';

const shareLockZoneRevision = vi.fn();
const runMessengerReadTx = vi.fn();

vi.mock('./messenger-core-revision-write.ops', () => ({
  shareLockZoneRevision: (...args: unknown[]) => shareLockZoneRevision(...args),
}));

vi.mock('./messenger-core-revision-tx', () => ({
  runMessengerReadTx: (...args: unknown[]) => runMessengerReadTx(...args),
}));

describe('Messenger zone read snapshot', () => {
  beforeEach(() => {
    shareLockZoneRevision.mockReset().mockResolvedValue(7n);
    runMessengerReadTx.mockReset().mockImplementation(async (_prisma, fn) => fn(_prisma));
  });

  it('releases the SHARE lock before reading zone state and returns a decimal checkpoint', async () => {
    const order: string[] = [];
    runMessengerReadTx.mockImplementation(async (_prisma, fn) => {
      order.push('tx-start');
      const value = await fn(_prisma);
      order.push('tx-end');
      return value;
    });
    shareLockZoneRevision.mockImplementation(async () => {
      order.push('lock');
      return 7n;
    });
    const result = await snapshotMessengerZoneRead({} as never, 'INTERNAL', async () => {
      order.push('read');
      return { items: [] };
    });
    expect(order).toEqual(['tx-start', 'lock', 'tx-end', 'read']);
    expect(result.checkpoint).toBe('7');
    expect(result.value).toEqual({ items: [] });
  });
});
