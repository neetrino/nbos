import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { resolveBullmqConcurrency } from '../../../runtime/bullmq-concurrency';
import { logBullmqJob } from '../../../runtime/bullmq-job-log';
import { resolveBullmqWorkerRuntimeOptions } from '../../../runtime/bullmq-worker-runtime';
import { BullmqWorkerRegistry } from '../../../runtime/bullmq-worker-registry';
import { shouldRegisterBullmqWorkers } from '../../../runtime/process-role';
import { createQueueWorkerConnection, getRedisQueueUrl } from '../../../runtime/queue-redis';
import { OpsJobFailureAlertService } from '../../ops-alerts/ops-job-failure-alert.service';
import { AtsCallRecordingDownloadService } from './ats-call-recording-download.service';
import {
  ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME,
  ATS_CALL_RECORDING_QUEUE_NAME,
  type AtsCallRecordingJobPayload,
} from './ats-call-recording.constants';

@Injectable()
export class AtsCallRecordingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AtsCallRecordingWorker.name);
  private worker: Worker<AtsCallRecordingJobPayload> | null = null;
  private connection: Redis | null = null;

  constructor(
    private readonly downloadService: AtsCallRecordingDownloadService,
    private readonly registry: BullmqWorkerRegistry,
    @Optional() private readonly opsAlerts?: OpsJobFailureAlertService,
  ) {}

  onModuleInit() {
    if (!shouldRegisterBullmqWorkers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) return;
    const concurrency = resolveBullmqConcurrency('atsCallRecording');
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker<AtsCallRecordingJobPayload>(
      ATS_CALL_RECORDING_QUEUE_NAME,
      async (job) => this.runLoggedJob(job),
      { connection: this.connection, concurrency, ...resolveBullmqWorkerRuntimeOptions() },
    );
    this.registry.register(ATS_CALL_RECORDING_QUEUE_NAME);
    this.worker.on('failed', (job, error) => {
      this.logger.error(`ATS recording worker failed for job ${job?.id ?? 'unknown'}.`, error);
      void this.opsAlerts?.notifyIfBullmqFinallyFailed(ATS_CALL_RECORDING_QUEUE_NAME, job, error);
    });
  }

  private async runLoggedJob(job: {
    name: string;
    id?: string;
    attemptsMade: number;
    opts: { attempts?: number };
    data: AtsCallRecordingJobPayload;
  }): Promise<void> {
    const started = Date.now();
    try {
      if (job.name !== ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME) return;
      await this.downloadService.processJob(job.data, job.attemptsMade, job.opts.attempts);
      logBullmqJob(this.logger, {
        queue: ATS_CALL_RECORDING_QUEUE_NAME,
        jobName: job.name,
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'completed',
      });
    } catch (error) {
      logBullmqJob(this.logger, {
        queue: ATS_CALL_RECORDING_QUEUE_NAME,
        jobName: job.name,
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'failed',
        errorCode: error instanceof Error ? error.name : 'Error',
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.worker = null;
    await this.connection?.quit();
    this.connection = null;
  }
}
