import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChannelLastOwnReadReceipt } from './messenger-channel-read-receipt.ops';

function createMockPrisma(overrides: {
  lastOwn?: { id: string; createdAt: Date } | null;
  readCount?: number;
}) {
  const lastOwn = overrides.lastOwn ?? null;
  const readCount = overrides.readCount ?? 0;
  return {
    messengerChannelMessage: {
      findFirst: vi.fn().mockResolvedValue(lastOwn),
    },
    messengerChannelReadState: {
      count: vi.fn().mockResolvedValue(readCount),
    },
  } as unknown as import('@nbos/database').PrismaClient;
}

describe('getChannelLastOwnReadReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when viewer has no messages', async () => {
    const prisma = createMockPrisma({ lastOwn: null });
    const r = await getChannelLastOwnReadReceipt(prisma, 'ch-1', 'emp-1');
    expect(r).toEqual({ lastOwnMessageId: null, lastOwnMessageSeenByOthers: false });
    expect(prisma.messengerChannelReadState.count).not.toHaveBeenCalled();
  });

  it('returns true when another reader cursor covers last own message', async () => {
    const t = new Date('2026-04-30T12:00:00.000Z');
    const prisma = createMockPrisma({
      lastOwn: { id: 'msg-9', createdAt: t },
      readCount: 2,
    });
    const r = await getChannelLastOwnReadReceipt(prisma, 'ch-1', 'emp-1');
    expect(r.lastOwnMessageId).toBe('msg-9');
    expect(r.lastOwnMessageSeenByOthers).toBe(true);
  });
});
