import { describe, expect, it, vi } from 'vitest';
import { failQueuedOutboundStubNoProvider } from './mail-outbound-finalize-stub.ops';

describe('failQueuedOutboundStubNoProvider', () => {
  it('returns true when updateMany affects one row', async () => {
    const prisma = {
      emailMessage: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as never;
    const ok = await failQueuedOutboundStubNoProvider(prisma, {
      threadId: 't1',
      messageId: 'm1',
    });
    expect(ok).toBe(true);
  });

  it('returns false when no row matches', async () => {
    const prisma = {
      emailMessage: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as never;
    const ok = await failQueuedOutboundStubNoProvider(prisma, {
      threadId: 't1',
      messageId: 'm1',
    });
    expect(ok).toBe(false);
  });
});
