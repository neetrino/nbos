import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { DriveService } from '../drive/drive.service';
import { executeAttachmentDownload } from './mail-attachment-download.run';
import type { MailAttachmentDownloadResult } from './mail-attachment-download.types';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';

@Injectable()
export class MailAttachmentDownloadService {
  private readonly logger = new Logger(MailAttachmentDownloadService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly adapterFactory: MailProviderAdapterFactory,
    private readonly driveService: DriveService,
    private readonly config: ConfigService,
  ) {}

  /** Worker download: Drive FileAsset + READY, or FAILED without burning retries. */
  async downloadAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentDownloadResult> {
    return executeAttachmentDownload({
      prisma: this.prisma,
      adapterFactory: this.adapterFactory,
      driveService: this.driveService,
      config: this.config,
      messageId,
      attachmentId,
      logError: (message) => this.logger.error(message),
      logWarn: (message) => this.logger.warn(message),
    });
  }
}
