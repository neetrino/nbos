import { describe, expect, it, vi } from 'vitest';
import { MAIL_ATTACHMENT_PENDING_STUCK_MS } from './mail-attachment.constants';
import { listStuckPendingAttachmentDownloads } from './mail-sync-upsert-stuck-attachments.ops';

describe('listStuckPendingAttachmentDownloads', () => {
  it('selects PENDING rows without fileAsset older than the stuck timeout', async () => {
    const now = new Date('2026-08-19T12:00:00.000Z');
    const findMany = vi.fn().mockResolvedValue([{ id: 'att-stuck' }]);
    const rows = await listStuckPendingAttachmentDownloads(
      { emailAttachment: { findMany } } as never,
      'msg-1',
      now,
    );
    expect(rows).toEqual([{ messageId: 'msg-1', attachmentId: 'att-stuck' }]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        messageId: 'msg-1',
        downloadStatus: 'PENDING',
        fileAssetId: null,
        createdAt: { lte: new Date(now.getTime() - MAIL_ATTACHMENT_PENDING_STUCK_MS) },
      },
      select: { id: true },
    });
  });
});
