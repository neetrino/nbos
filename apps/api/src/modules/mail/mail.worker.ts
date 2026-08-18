import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { resolveBullmqConcurrency } from '../../runtime/bullmq-concurrency';
import { resolveBullmqWorkerRuntimeOptions } from '../../runtime/bullmq-worker-runtime';
import { logBullmqJob } from '../../runtime/bullmq-job-log';
import { BullmqWorkerRegistry } from '../../runtime/bullmq-worker-registry';
import { shouldRegisterBullmqWorkers } from '../../runtime/process-role';
import { createQueueWorkerConnection, getRedisQueueUrl } from '../../runtime/queue-redis';
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
    private readonly registry: BullmqWorkerRegistry,
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
      async (job) => {
        const started = Date.now();
        try {
          await this.process(job.name, job.data);
          logBullmqJob(this.logger, {
            queue: MAIL_QUEUE_NAME,
            jobName: job.name,
            jobId: job.id,
            attempt: job.attemptsMade + 1,
            durationMs: Date.now() - started,
            status: 'completed',
          });
        } catch (error) {
          logBullmqJob(this.logger, {
            queue: MAIL_QUEUE_NAME,
            jobName: job.name,
            jobId: job.id,
            attempt: job.attemptsMade + 1,
            durationMs: Date.now() - started,
            status: 'failed',
            errorCode: error instanceof Error ? error.name : 'Error',
          });
          throw error;
        }
      },
      { connection: this.connection, concurrency, ...resolveBullmqWorkerRuntimeOptions() },
    );
    this.registry.register(MAIL_QUEUE_NAME);
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
    this.worker = null;
    await this.connection?.quit();
    this.connection = null;
  }
}
