import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailAttachmentMutationService } from './mail-attachment-mutation.service';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';

vi.mock('./mail-thread-message-access.ops', () => ({
  fetchMailThreadMessageForEdit: vi.fn(),
}));

vi.mock('./mail-thread-detail-require.ops', () => ({
  requireMailThreadDetailDto: vi.fn(),
}));

describe('MailAttachmentMutationService.retryAttachmentDownload', () => {
  const enqueueAttachmentDownload = vi.fn();
  const updateMany = vi.fn();
  const findFirst = vi.fn();

  beforeEach(() => {
    enqueueAttachmentDownload.mockReset().mockResolvedValue(true);
    updateMany.mockReset();
    findFirst.mockReset();
    vi.mocked(fetchMailThreadMessageForEdit).mockResolvedValue({
      status: 'ok',
      thread: {} as never,
      message: {} as never,
    });
    vi.mocked(requireMailThreadDetailDto).mockResolvedValue({ thread: { id: 't1' } } as never);
  });

  function service(): MailAttachmentMutationService {
    return new MailAttachmentMutationService(
      { emailAttachment: { findFirst, updateMany } } as never,
      { enqueueAttachmentDownload } as never,
      { downloadAttachment: vi.fn() } as never,
    );
  }

  it('re-enqueues Pending without flipping status', async () => {
    findFirst.mockResolvedValue({ id: 'a1', downloadStatus: 'PENDING' });
    await service().retryAttachmentDownload('e1', 'OWN', 't1', 'm1', 'a1');
    expect(updateMany).not.toHaveBeenCalled();
    expect(enqueueAttachmentDownload).toHaveBeenCalledWith({
      messageId: 'm1',
      attachmentId: 'a1',
    });
  });

  it('moves Failed to Pending then enqueues', async () => {
    findFirst.mockResolvedValue({ id: 'a1', downloadStatus: 'FAILED' });
    updateMany.mockResolvedValue({ count: 1 });
    await service().retryAttachmentDownload('e1', 'OWN', 't1', 'm1', 'a1');
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'a1', messageId: 'm1', downloadStatus: 'FAILED' },
      data: { downloadStatus: 'PENDING' },
    });
    expect(enqueueAttachmentDownload).toHaveBeenCalledWith({
      messageId: 'm1',
      attachmentId: 'a1',
    });
  });

  it('rejects Ready', async () => {
    findFirst.mockResolvedValue({ id: 'a1', downloadStatus: 'READY' });
    await expect(
      service().retryAttachmentDownload('e1', 'OWN', 't1', 'm1', 'a1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(enqueueAttachmentDownload).not.toHaveBeenCalled();
  });
});
