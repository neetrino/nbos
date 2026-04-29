import { describe, expect, it, vi } from 'vitest';
import { updateThreadNeedsBusinessLink } from './mail-thread-needs-link.ops';

describe('updateThreadNeedsBusinessLink', () => {
  it('returns true when updateMany affects one row', async () => {
    const prisma = {
      emailThread: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as never;
    const ok = await updateThreadNeedsBusinessLink(prisma, {
      threadId: 't1',
      needsBusinessLink: false,
    });
    expect(ok).toBe(true);
  });

  it('returns false when no row matches', async () => {
    const prisma = {
      emailThread: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as never;
    const ok = await updateThreadNeedsBusinessLink(prisma, {
      threadId: 't1',
      needsBusinessLink: true,
    });
    expect(ok).toBe(false);
  });
});
