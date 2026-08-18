import { describe, expect, it, vi } from 'vitest';
import { queueFailedOutboundForRetry } from './mail-outbound-retry-send.ops';

describe('queueFailedOutboundForRetry', () => {
  it('returns true when a FAILED row is moved to QUEUED', async () => {
    const prisma = {
      emailMessage: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    } as never;
    await expect(
      queueFailedOutboundForRetry(prisma, { threadId: 't1', messageId: 'm1' }),
    ).resolves.toBe(true);
  });

  it('returns false when no FAILED row matches', async () => {
    const prisma = {
      emailMessage: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    } as never;
    await expect(
      queueFailedOutboundForRetry(prisma, { threadId: 't1', messageId: 'm1' }),
    ).resolves.toBe(false);
  });
});
