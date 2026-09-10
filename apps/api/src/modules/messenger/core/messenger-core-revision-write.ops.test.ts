import { describe, expect, it, vi } from 'vitest';
import { allocateZoneRevisionSql, shareLockZoneRevisionSql } from './messenger-core-revision-write.ops';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

function sqlText(fragment: unknown): string {
  if (fragment && typeof fragment === 'object' && 'strings' in fragment) {
    return (fragment as { strings: readonly string[] }).strings.join(' ');
  }
  return JSON.stringify(fragment);
}

describe('Messenger revision writer protocol', () => {
  it('allocates the next revision by locking the zone counter row, not a sequence', () => {
    const text = sqlText(allocateZoneRevisionSql('INTERNAL'));
    expect(text).toMatch(/ON CONFLICT \(zone\) DO UPDATE/);
    expect(text).toMatch(/revision \+ 1/);
    expect(text).not.toMatch(/nextval/);
    expect(text).not.toMatch(/CREATE SEQUENCE/);
    expect(text).not.toMatch(/body|preview|title|payload|secret/i);
  });

  it('share-locks the counter so readers cannot acknowledge an uncommitted lower revision', () => {
    const text = sqlText(shareLockZoneRevisionSql('CLIENT'));
    expect(text).toMatch(/FOR SHARE/);
    expect(text).toMatch(/messenger_zone_revision_counters/);
  });

  it('rolls back state and revision together when the write transaction fails', async () => {
    const upsert = vi.fn();
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        try {
          return await fn(prisma);
        } catch (error) {
          upsert.mockClear();
          throw error;
        }
      }),
    };
    await expect(
      runMessengerWriteTx(prisma as never, async (tx) => {
        upsert();
        expect(tx).toBe(prisma);
        throw new Error('state failed');
      }),
    ).rejects.toThrow('state failed');
    expect(upsert).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'ReadCommitted' }),
    );
  });

  it('uses READ COMMITTED for the snapshot barrier with no serialization retry', async () => {
    const { runMessengerReadTx } = await import('./messenger-core-revision-tx');
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
    };
    await runMessengerReadTx(prisma as never, async () => 'ok');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'ReadCommitted' }),
    );
  });

  it('runs the counter update after durable state inside the same write transaction', async () => {
    const order: string[] = [];
    const prisma = {
      $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
      $queryRaw: vi.fn(async () => {
        order.push('counter');
        return [{ revision: 4n }];
      }),
      messengerConversationRevision: {
        upsert: vi.fn(async () => {
          order.push('marker');
        }),
      },
    };
    const { bumpGlobalConversationRevision } = await import('./messenger-core-revision-write.ops');
    await runMessengerWriteTx(prisma as never, async (tx) => {
      order.push('state');
      await bumpGlobalConversationRevision(tx as never, 'INTERNAL', 'c1');
    });
    expect(order).toEqual(['state', 'counter', 'marker']);
  });
});
