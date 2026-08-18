import { describe, expect, it, vi } from 'vitest';
import { queueFailedAttachmentForRetry } from './mail-attachment-retry.ops';

describe('queueFailedAttachmentForRetry', () => {
  it('returns true when a FAILED row is moved to PENDING', async () => {
    const prisma = {
      emailAttachment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    } as never;
    await expect(
      queueFailedAttachmentForRetry(prisma, { messageId: 'm1', attachmentId: 'a1' }),
    ).resolves.toBe(true);
  });

  it('returns false when no FAILED row matches', async () => {
    const prisma = {
      emailAttachment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    } as never;
    await expect(
      queueFailedAttachmentForRetry(prisma, { messageId: 'm1', attachmentId: 'a1' }),
    ).resolves.toBe(false);
  });
});
