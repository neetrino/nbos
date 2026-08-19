import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { toBullMqSafeJobId } from '@nbos/shared';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../runtime/process-role';
import { createQueueProducerConnection, getRedisQueueUrl } from '../../runtime/queue-redis';
import {
  MAIL_ATTACHMENT_DOWNLOAD_JOB_NAME,
  MAIL_QUEUE_NAME,
  MAIL_SEND_JOB_NAME,
  MAIL_SYNC_JOB_NAME,
  type MailQueueJobPayload,
} from './mail-queue.constants';
import { mailAttachmentJobId } from './mail-attachment-runtime.constants';
import { mailSendJobId } from './mail-outbound-runtime.constants';
import { mailSyncJobId } from './mail-sync-runtime.constants';
import { prepareMailJobIdForEnqueue } from './mail-queue-replace-terminal';

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private queue: Queue<MailQueueJobPayload> | null = null;
  private connection: Redis | null = null;

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      return;
    }
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue<MailQueueJobPayload>(MAIL_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_CRITICAL_JOB_OPTIONS,
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    this.queue = null;
    await this.connection?.quit();
    this.connection = null;
  }

  isQueueAvailable(): boolean {
    return this.queue !== null;
  }

  async enqueueSync(mailAccountId: string): Promise<boolean> {
    return this.add(
      MAIL_SYNC_JOB_NAME,
      { kind: 'sync', mailAccountId },
      mailSyncJobId(mailAccountId),
    );
  }

  async enqueueSend(payload: {
    mailAccountId: string;
    messageId: string;
    actorEmployeeId: string;
  }): Promise<boolean> {
    // Replace completed/failed job with the same id (orphan QUEUED after worker restart).
    return this.add(
      MAIL_SEND_JOB_NAME,
      { kind: 'send', ...payload },
      mailSendJobId(payload.messageId),
      true, // drop completed/failed so reconcile can re-enqueue the same message
    );
  }

  async enqueueAttachmentDownload(payload: {
    messageId: string;
    attachmentId: string;
  }): Promise<boolean> {
    return this.add(
      MAIL_ATTACHMENT_DOWNLOAD_JOB_NAME,
      { kind: 'attachment', ...payload },
      mailAttachmentJobId(payload.attachmentId),
      true,
    );
  }

  private async add(
    jobName: string,
    payload: MailQueueJobPayload,
    jobId?: string,
    replaceTerminal = false,
  ): Promise<boolean> {
    if (!this.queue) {
      return false;
    }
    try {
      const safeJobId = jobId ? toBullMqSafeJobId(jobId) : undefined;
      if (replaceTerminal && safeJobId) {
        const prepared = await prepareMailJobIdForEnqueue(this.queue, safeJobId);
        if (prepared === 'in_flight') {
          return true;
        }
      }
      await this.queue.add(jobName, payload, safeJobId ? { jobId: safeJobId } : undefined);
      return true;
    } catch (caught) {
      if (isDuplicateJobError(caught)) {
        return true;
      }
      const detail = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Failed to enqueue Mail job ${jobName}: ${detail}`);
      return false;
    }
  }
}

function isDuplicateJobError(caught: unknown): boolean {
  const message = caught instanceof Error ? caught.message : String(caught);
  return (
    /already (exists|present)/i.test(message) || (/jobId/i.test(message) && /exist/i.test(message))
  );
}
