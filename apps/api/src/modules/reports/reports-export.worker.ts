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
  REPORT_EXPORT_JOB_NAME,
  REPORT_EXPORT_QUEUE_NAME,
  type ReportExportQueuePayload,
} from './reports-queue.constants';
import { ReportsService } from './reports.service';

@Injectable()
export class ReportsExportWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsExportWorker.name);
  private worker: Worker<ReportExportQueuePayload> | null = null;
  private connection: Redis | null = null;

  constructor(
    private readonly reportsService: ReportsService,
    private readonly registry: BullmqWorkerRegistry,
    @Optional() private readonly opsAlerts?: OpsJobFailureAlertService,
  ) {}

  onModuleInit() {
    if (!shouldRegisterBullmqWorkers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) return;
    const concurrency = resolveBullmqConcurrency('reports');
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker<ReportExportQueuePayload>(
      REPORT_EXPORT_QUEUE_NAME,
      async (job) => {
        const started = Date.now();
        try {
          if (job.name !== REPORT_EXPORT_JOB_NAME) return;
          await this.reportsService.processExportJob(job.data.jobId, job.data.actorId);
          logBullmqJob(this.logger, {
            queue: REPORT_EXPORT_QUEUE_NAME,
            jobName: job.name,
            jobId: job.id,
            attempt: job.attemptsMade + 1,
            durationMs: Date.now() - started,
            status: 'completed',
          });
        } catch (error) {
          logBullmqJob(this.logger, {
            queue: REPORT_EXPORT_QUEUE_NAME,
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
    this.registry.register(REPORT_EXPORT_QUEUE_NAME);
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Report export worker failed for BullMQ job ${job?.id ?? 'unknown'}.`,
        error,
      );
      void this.opsAlerts?.notifyIfBullmqFinallyFailed(REPORT_EXPORT_QUEUE_NAME, job, error);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.worker = null;
    await this.connection?.quit();
    this.connection = null;
  }
}
