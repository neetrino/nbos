import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { dispatchAttachmentDownload } from './mail-attachment-dispatch';

describe('dispatchAttachmentDownload', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('does not download inline when enqueue is accepted', async () => {
    const downloadAttachment = vi.fn();
    await dispatchAttachmentDownload({
      queue: { enqueueAttachmentDownload: vi.fn().mockResolvedValue(true) } as never,
      downloadService: { downloadAttachment } as never,
      logger: { warn: vi.fn() } as unknown as Logger,
      messageId: 'm1',
      attachmentId: 'a1',
    });
    expect(downloadAttachment).not.toHaveBeenCalled();
  });

  it('returns 503 and does not download in production when enqueue fails', async () => {
    process.env.NODE_ENV = 'production';
    const downloadAttachment = vi.fn();
    await expect(
      dispatchAttachmentDownload({
        queue: { enqueueAttachmentDownload: vi.fn().mockResolvedValue(false) } as never,
        downloadService: { downloadAttachment } as never,
        logger: { warn: vi.fn() } as unknown as Logger,
        messageId: 'm1',
        attachmentId: 'a1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(downloadAttachment).not.toHaveBeenCalled();
  });

  it('uses inline fallback outside production and logs mail.inline_fallback', async () => {
    process.env.NODE_ENV = 'development';
    const downloadAttachment = vi.fn();
    const warn = vi.fn();
    await dispatchAttachmentDownload({
      queue: { enqueueAttachmentDownload: vi.fn().mockResolvedValue(false) } as never,
      downloadService: { downloadAttachment } as never,
      logger: { warn } as unknown as Logger,
      messageId: 'm1',
      attachmentId: 'a1',
    });
    expect(downloadAttachment).toHaveBeenCalledWith('m1', 'a1');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(MAIL_INLINE_FALLBACK_LOG));
  });
});
