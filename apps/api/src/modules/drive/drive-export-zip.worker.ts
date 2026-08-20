import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { resolveBullmqConcurrency } from '../../runtime/bullmq-concurrency';
import { resolveBullmqWorkerRuntimeOptions } from '../../runtime/bullmq-worker-runtime';
import { logBullmqJob } from '../../runtime/bullmq-job-log';
import { BullmqWorkerRegistry } from '../../runtime/bullmq-worker-registry';
import { shouldRegisterBullmqWorkers } from '../../runtime/process-role';
import { createQueueWorkerConnection, getRedisQueueUrl } from '../../runtime/queue-redis';
import { OpsJobFailureAlertService } from '../ops-alerts/ops-job-failure-alert.service';
import {
  DRIVE_ZIP_EXPORT_JOB_NAME,
  DRIVE_ZIP_EXPORT_QUEUE_NAME,
  type DriveZipExportQueuePayload,
} from './drive-export-zip-queue.constants';
import { DriveZipExportService } from './drive-zip-export.service';

@Injectable()
export class DriveExportZipWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DriveExportZipWorker.name);
  private worker: Worker<DriveZipExportQueuePayload> | null = null;
  private connection: Redis | null = null;

  constructor(
    private readonly driveZipExports: DriveZipExportService,
    private readonly registry: BullmqWorkerRegistry,
    @Optional() private readonly opsAlerts?: OpsJobFailureAlertService,
  ) {}

  onModuleInit() {
    if (!shouldRegisterBullmqWorkers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) return;
    const concurrency = resolveBullmqConcurrency('driveZip');
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker<DriveZipExportQueuePayload>(
      DRIVE_ZIP_EXPORT_QUEUE_NAME,
      async (job) => {
        const started = Date.now();
        try {
          if (job.name !== DRIVE_ZIP_EXPORT_JOB_NAME) return;
          await this.driveZipExports.processZipExportJob(job.data.jobId, job.data.actorId);
          logBullmqJob(this.logger, {
            queue: DRIVE_ZIP_EXPORT_QUEUE_NAME,
            jobName: job.name,
            jobId: job.id,
            attempt: job.attemptsMade + 1,
            durationMs: Date.now() - started,
            status: 'completed',
          });
        } catch (error) {
          logBullmqJob(this.logger, {
            queue: DRIVE_ZIP_EXPORT_QUEUE_NAME,
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
    this.registry.register(DRIVE_ZIP_EXPORT_QUEUE_NAME);
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Drive ZIP export worker failed for BullMQ job ${job?.id ?? 'unknown'}.`,
        error,
      );
      void this.opsAlerts?.notifyIfBullmqFinallyFailed(DRIVE_ZIP_EXPORT_QUEUE_NAME, job, error);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.worker = null;
    await this.connection?.quit();
    this.connection = null;
  }
}
