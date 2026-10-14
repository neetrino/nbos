import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { replaceOutboundDraftAttachments } from './mail-outbound-draft.ops';

describe('replaceOutboundDraftAttachments', () => {
  it('replaces the draft rows with the given Drive files', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'file-1',
        displayName: 'Notes',
        originalName: 'notes.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 12,
      },
    ]);
    await replaceOutboundDraftAttachments(
      { emailAttachment: { deleteMany, createMany }, fileAsset: { findMany } } as never,
      'message-1',
      ['file-1', 'file-1'],
    );
    expect(deleteMany).toHaveBeenCalledWith({ where: { messageId: 'message-1' } });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          messageId: 'message-1',
          fileAssetId: 'file-1',
          fileName: 'notes.pdf',
          downloadStatus: 'READY',
        }),
      ],
    });
  });

  it('rejects a missing Drive file', async () => {
    const tx = {
      emailAttachment: { deleteMany: vi.fn(), createMany: vi.fn() },
      fileAsset: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await expect(
      replaceOutboundDraftAttachments(tx as never, 'message-1', ['missing']),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
