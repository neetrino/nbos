import { describe, expect, it, vi } from 'vitest';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';

describe('queueOutboundDraftMessage', () => {
  it('returns true when updateMany affects one row', async () => {
    const prisma = {
      emailMessage: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      emailThread: {
        update: vi.fn().mockResolvedValue({}),
      },
    } as never;
    const ok = await queueOutboundDraftMessage(prisma, {
      threadId: 't1',
      messageId: 'm1',
    });
    expect(ok).toBe(true);
    expect(prisma.emailThread.update).toHaveBeenCalled();
  });

  it('returns false when no row matches', async () => {
    const prisma = {
      emailMessage: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as never;
    const ok = await queueOutboundDraftMessage(prisma, {
      threadId: 't1',
      messageId: 'm1',
    });
    expect(ok).toBe(false);
  });
});
