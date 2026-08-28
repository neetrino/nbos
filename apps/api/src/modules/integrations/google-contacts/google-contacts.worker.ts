import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { BullmqWorkerRegistry } from '../../../runtime/bullmq-worker-registry';
import { resolveBullmqWorkerRuntimeOptions } from '../../../runtime/bullmq-worker-runtime';
import { logBullmqJob } from '../../../runtime/bullmq-job-log';
import { shouldRegisterBullmqWorkers } from '../../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueWorkerConnection,
  getRedisQueueUrl,
} from '../../../runtime/queue-redis';
import { OpsJobFailureAlertService } from '../../ops-alerts/ops-job-failure-alert.service';
import {
  GOOGLE_CONTACTS_JOB_NAME,
  GOOGLE_CONTACTS_OUTBOUND_GAP_MS,
  GOOGLE_CONTACTS_QUEUE_NAME,
} from './google-contacts.constants';
import { GoogleContactsSyncService } from './google-contacts-sync.service';
import type { GoogleContactsJobPayload } from './google-contacts.types';

@Injectable()
export class GoogleContactsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GoogleContactsWorker.name);
  private worker: Worker<GoogleContactsJobPayload> | null = null;
  private connection: ReturnType<typeof createQueueWorkerConnection> | null = null;

  constructor(
    private readonly syncService: GoogleContactsSyncService,
    private readonly registry: BullmqWorkerRegistry,
    @Optional() private readonly opsAlerts?: OpsJobFailureAlertService,
  ) {}

  onModuleInit() {
    if (!shouldRegisterBullmqWorkers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_QUEUE_URL/REDIS_URL unset — Google Contacts worker disabled');
      return;
    }
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker<GoogleContactsJobPayload>(
      GOOGLE_CONTACTS_QUEUE_NAME,
      async (job) => this.runLogged(job),
      { connection: this.connection, concurrency: 1, ...resolveBullmqWorkerRuntimeOptions() },
    );
    this.registry.register(GOOGLE_CONTACTS_QUEUE_NAME);
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Google Contacts sync failed jobId=${job?.id}`, error);
      void this.opsAlerts?.notifyIfBullmqFinallyFailed(GOOGLE_CONTACTS_QUEUE_NAME, job, error);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.worker = null;
    await closeRedisConnection(this.connection);
    this.connection = null;
  }

  private async runLogged(job: Job<GoogleContactsJobPayload>): Promise<void> {
    const started = Date.now();
    try {
      await this.process(job);
      logBullmqJob(this.logger, {
        queue: GOOGLE_CONTACTS_QUEUE_NAME,
        jobName: job.name || GOOGLE_CONTACTS_JOB_NAME,
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'completed',
      });
    } catch (error) {
      logBullmqJob(this.logger, {
        queue: GOOGLE_CONTACTS_QUEUE_NAME,
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

  async process(job: Job<GoogleContactsJobPayload>): Promise<void> {
    try {
      await this.syncService.syncContact(job.data.contactId);
    } finally {
      await waitGap(GOOGLE_CONTACTS_OUTBOUND_GAP_MS);
    }
  }
}

function waitGap(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
