import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../../common/redis/redis-connection';
import {
  MAIL_QUEUE_NAME,
  MAIL_SEND_JOB_NAME,
  MAIL_SYNC_JOB_NAME,
  type MailQueueJobPayload,
} from './mail-queue.constants';

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private queue: Queue<MailQueueJobPayload> | null = null;
  private connection: Redis | null = null;

  onModuleInit() {
    const redisUrl = getRedisUrl();
    if (!redisUrl) {
      return;
    }
    this.connection = createRedisConnection(redisUrl);
    this.queue = new Queue<MailQueueJobPayload>(MAIL_QUEUE_NAME, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    await this.connection?.quit();
  }

  isQueueAvailable(): boolean {
    return this.queue !== null;
  }

  async enqueueSync(mailAccountId: string): Promise<boolean> {
    return this.add(MAIL_SYNC_JOB_NAME, { kind: 'sync', mailAccountId });
  }

  async enqueueSend(payload: {
    mailAccountId: string;
    messageId: string;
    actorEmployeeId: string;
  }): Promise<boolean> {
    return this.add(MAIL_SEND_JOB_NAME, { kind: 'send', ...payload });
  }

  private async add(jobName: string, payload: MailQueueJobPayload): Promise<boolean> {
    if (!this.queue) {
      return false;
    }
    try {
      await this.queue.add(jobName, payload);
      return true;
    } catch (caught) {
      this.logger.error(`Failed to enqueue Mail job ${jobName}.`, caught);
      return false;
    }
  }
}
