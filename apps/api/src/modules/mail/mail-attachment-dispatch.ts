import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { isMailProductionRuntime } from './mail-outbound-dispatch';
import { MailAttachmentDownloadService } from './mail-attachment-download.service';
import { MailQueueService } from './mail-queue.service';

/**
 * Enters the attachment download contour after the row is already PENDING.
 * Production enqueue miss → 503, row stays PENDING.
 * Local without Redis → inline download + `mail.inline_fallback`.
 */
export async function dispatchAttachmentDownload(params: {
  queue: MailQueueService;
  downloadService: MailAttachmentDownloadService;
  logger: Logger;
  messageId: string;
  attachmentId: string;
}): Promise<void> {
  const enqueued = await params.queue.enqueueAttachmentDownload({
    messageId: params.messageId,
    attachmentId: params.attachmentId,
  });
  if (enqueued) {
    return;
  }
  if (isMailProductionRuntime()) {
    throw new ServiceUnavailableException('Mail attachment queue is unavailable');
  }
  params.logger.warn(`${MAIL_INLINE_FALLBACK_LOG} attachmentId=${params.attachmentId}`);
  await params.downloadService.downloadAttachment(params.messageId, params.attachmentId);
}
