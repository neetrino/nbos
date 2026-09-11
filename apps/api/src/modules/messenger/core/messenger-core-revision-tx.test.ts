import { describe, expect, it, vi } from 'vitest';
import { runMessengerReadTx, runMessengerWriteTx } from './messenger-core-revision-tx';

type EngineClient = {
  _engineConfig: { adapter: string };
  $transaction: (
    this: EngineClient | undefined,
    fn: (tx: EngineClient) => Promise<unknown>,
    options?: { isolationLevel?: string },
  ) => Promise<unknown>;
};

function createEngineClient(): EngineClient {
  return {
    _engineConfig: { adapter: 'pg' },
    $transaction: function (this: EngineClient | undefined, fn, options) {
      if (this?._engineConfig === undefined) {
        throw new TypeError("Cannot read properties of undefined (reading '_engineConfig')");
      }
      expect(options).toEqual({ isolationLevel: 'ReadCommitted' });
      return fn(this);
    },
  };
}

describe('runMessengerWriteTx Prisma binding', () => {
  it('invokes $transaction as a method so Prisma 7 can read _engineConfig', async () => {
    const prisma = createEngineClient();
    await expect(runMessengerWriteTx(prisma as never, async (tx) => tx)).resolves.toBe(prisma);
  });

  it('keeps the same binding for the read snapshot barrier', async () => {
    const prisma = createEngineClient();
    await expect(runMessengerReadTx(prisma as never, async () => 'ok')).resolves.toBe('ok');
  });

  it('does not start a nested $transaction when already inside a write client', async () => {
    const inner = vi.fn(async () => 'nested');
    const prisma = createEngineClient();
    const result = await runMessengerWriteTx(prisma as never, async (tx) =>
      runMessengerWriteTx(tx, inner),
    );
    expect(result).toBe('nested');
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('runs the callback directly when $transaction is absent', async () => {
    const prisma = {};
    await expect(runMessengerWriteTx(prisma as never, async () => 7)).resolves.toBe(7);
  });
});
