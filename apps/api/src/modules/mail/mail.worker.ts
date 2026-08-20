import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { resolveBullmqConcurrency } from '../../runtime/bullmq-concurrency';
import { resolveBullmqWorkerRuntimeOptions } from '../../runtime/bullmq-worker-runtime';
import { logBullmqJob, type JobLogFields } from '../../runtime/bullmq-job-log';
import { BullmqWorkerRegistry } from '../../runtime/bullmq-worker-registry';
import { shouldRegisterBullmqWorkers } from '../../runtime/process-role';
import { createQueueWorkerConnection, getRedisQueueUrl } from '../../runtime/queue-redis';
import { OpsJobFailureAlertService } from '../ops-alerts/ops-job-failure-alert.service';
import { MailAttachmentDownloadService } from './mail-attachment-download.service';
import {
  MAIL_ATTACHMENT_DOWNLOAD_JOB_NAME,
  MAIL_QUEUE_NAME,
  MAIL_SEND_JOB_NAME,
  MAIL_SYNC_JOB_NAME,
  type MailQueueJobPayload,
} from './mail-queue.constants';
import {
  classifyMailProviderError,
  type MailProviderErrorClass,
} from './mail-provider-error.classify';
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
    private readonly downloadService: MailAttachmentDownloadService,
    private readonly registry: BullmqWorkerRegistry,
    @Optional() private readonly opsAlerts?: OpsJobFailureAlertService,
  ) {}

  onModuleInit() {
    if (!shouldRegisterBullmqWorkers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      return;
    }
    const concurrency = resolveBullmqConcurrency('mail');
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker<MailQueueJobPayload>(
      MAIL_QUEUE_NAME,
      async (job) => this.runLoggedJob(job.name, job.id, job.attemptsMade, job.data),
      { connection: this.connection, concurrency, ...resolveBullmqWorkerRuntimeOptions() },
    );
    this.registry.register(MAIL_QUEUE_NAME);
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Mail worker failed for job ${job?.id ?? 'unknown'}.`, error);
      void this.opsAlerts?.notifyIfBullmqFinallyFailed(MAIL_QUEUE_NAME, job, error);
    });
  }

  private async runLoggedJob(
    jobName: string,
    jobId: string | undefined,
    attemptsMade: number,
    data: MailQueueJobPayload,
  ): Promise<void> {
    const started = Date.now();
    const context = mailJobLogContext(data);
    try {
      const result = await this.process(jobName, data);
      logBullmqJob(this.logger, {
        queue: MAIL_QUEUE_NAME,
        jobName,
        jobId,
        attempt: attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'completed',
        ...context,
        errorClass: result?.errorClass,
      });
    } catch (error) {
      logBullmqJob(this.logger, {
        queue: MAIL_QUEUE_NAME,
        jobName,
        jobId,
        attempt: attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'failed',
        errorCode: error instanceof Error ? error.name : 'Error',
        errorClass: classifyMailProviderError(error),
        ...context,
      });
      throw error;
    }
  }

  private async process(
    jobName: string,
    data: MailQueueJobPayload,
  ): Promise<{ errorClass?: MailProviderErrorClass } | undefined> {
    if (jobName === MAIL_SYNC_JOB_NAME && data.kind === 'sync') {
      await this.syncService.syncAccount(data.mailAccountId);
      return undefined;
    }
    if (jobName === MAIL_SEND_JOB_NAME && data.kind === 'send') {
      await this.sendService.sendQueuedMessage(
        data.mailAccountId,
        data.messageId,
        data.actorEmployeeId,
      );
      return undefined;
    }
    if (jobName === MAIL_ATTACHMENT_DOWNLOAD_JOB_NAME && data.kind === 'attachment') {
      return this.downloadService.downloadAttachment(data.messageId, data.attachmentId);
    }
    return undefined;
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.worker = null;
    await this.connection?.quit();
    this.connection = null;
  }
}

function mailJobLogContext(
  data: MailQueueJobPayload,
): Pick<JobLogFields, 'mailAccountId' | 'messageId'> {
  if (data.kind === 'sync') {
    return { mailAccountId: data.mailAccountId };
  }
  if (data.kind === 'send') {
    return { mailAccountId: data.mailAccountId, messageId: data.messageId };
  }
  return { messageId: data.messageId };
}
