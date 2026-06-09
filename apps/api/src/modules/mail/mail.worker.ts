import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../../common/redis/redis-connection';
import {
  MAIL_QUEUE_NAME,
  MAIL_SEND_JOB_NAME,
  MAIL_SYNC_JOB_NAME,
  type MailQueueJobPayload,
} from './mail-queue.constants';
import { MailSendService } from './mail-send.service';
import { MailSyncService } from './mail-sync.service';

@Injectable()
export class MailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorker.name);
  private worker: Worker<MailQueueJobPayload> | null = null;
  private connection: Redis | null = null;

  constructor(
    private readonly syncService: MailSyncService,
    private readonly sendService: MailSendService,
  ) {}

  onModuleInit() {
    const redisUrl = getRedisUrl();
    if (!redisUrl) {
      return;
    }
    this.connection = createRedisConnection(redisUrl);
    this.worker = new Worker<MailQueueJobPayload>(
      MAIL_QUEUE_NAME,
      async (job) => this.process(job.name, job.data),
      { connection: this.connection },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Mail worker failed for job ${job?.id ?? 'unknown'}.`, error);
    });
  }

  private async process(jobName: string, data: MailQueueJobPayload): Promise<void> {
    if (jobName === MAIL_SYNC_JOB_NAME && data.kind === 'sync') {
      await this.syncService.syncAccount(data.mailAccountId);
      return;
    }
    if (jobName === MAIL_SEND_JOB_NAME && data.kind === 'send') {
      await this.sendService.sendQueuedMessage(
        data.mailAccountId,
        data.messageId,
        data.actorEmployeeId,
      );
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
