import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { dispatchAttachmentDownload } from './mail-attachment-dispatch';
import { MailAttachmentDownloadService } from './mail-attachment-download.service';
import {
  isAttachmentDownloadRetryable,
  queueFailedAttachmentForRetry,
} from './mail-attachment-retry.ops';
import { MailQueueService } from './mail-queue.service';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailAttachmentMutationService {
  private readonly logger = new Logger(MailAttachmentMutationService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queue: MailQueueService,
    private readonly downloadService: MailAttachmentDownloadService,
  ) {}

  async retryAttachmentDownload(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailThreadDetailDto> {
    const access = await fetchMailThreadMessageForEdit(this.prisma, {
      threadId,
      messageId,
      employeeId,
      accessScope,
    });
    if (access.status === 'no_mailbox') {
      throw new NotFoundException('Thread not found');
    }
    if (access.status === 'no_message') {
      throw new NotFoundException('Message not found');
    }
    const attachment = await this.prisma.emailAttachment.findFirst({
      where: { id: attachmentId, messageId },
      select: { id: true, downloadStatus: true },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    await this.queueRetryableAndDispatch(messageId, attachmentId, attachment.downloadStatus);
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  private async queueRetryableAndDispatch(
    messageId: string,
    attachmentId: string,
    downloadStatus: string,
  ): Promise<void> {
    if (!isAttachmentDownloadRetryable(downloadStatus)) {
      throw new BadRequestException('Only pending or failed attachments can be retried');
    }
    if (downloadStatus === 'FAILED') {
      const updated = await queueFailedAttachmentForRetry(this.prisma, { messageId, attachmentId });
      if (!updated) {
        throw new BadRequestException('Only pending or failed attachments can be retried');
      }
    }
    await dispatchAttachmentDownload({
      queue: this.queue,
      downloadService: this.downloadService,
      logger: this.logger,
      messageId,
      attachmentId,
    });
  }
}
