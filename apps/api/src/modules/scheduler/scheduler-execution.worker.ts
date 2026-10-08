import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DelayedError, Worker, type Job } from 'bullmq';
import { resolveDbPoolRuntimeConfig } from '@nbos/database';
import { resolveBullmqWorkerRuntimeOptions } from '../../runtime/bullmq-worker-runtime';
import { shouldRegisterScheduledJobs } from '../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueWorkerConnection,
  getRedisQueueUrl,
} from '../../runtime/queue-redis';
import { SchedulerAiService } from './scheduler-ai.service';
import {
  SCHEDULER_EXECUTION_QUEUE_NAME,
  SCHEDULER_LEASE_RETRY_DELAY_MS,
} from './scheduler-occurrence.constants';
import { SchedulerOccurrenceService } from './scheduler-occurrence.service';
import type { SchedulerExecutionPayload } from './scheduler-execution-queue.service';
import { runSchedulerJobByName } from './scheduler-job-runner';
import { SCHEDULER_RUN_STATUS, type SchedulerTrigger } from './scheduler-lease.constants';
import { SchedulerService } from './scheduler.service';

type LeaseRunResult = { status?: string };

@Injectable()
export class SchedulerExecutionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerExecutionWorker.name);
  private worker: Worker<SchedulerExecutionPayload> | null = null;
  private connection: ReturnType<typeof createQueueWorkerConnection> | null = null;

  constructor(
    private readonly occurrences: SchedulerOccurrenceService,
    private readonly scheduler: SchedulerService,
    private readonly ai: SchedulerAiService,
  ) {}

  onModuleInit(): void {
    if (!shouldRegisterScheduledJobs()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('Scheduler execution worker disabled — Redis queue URL unset');
      return;
    }
    const runtime = resolveBullmqWorkerRuntimeOptions();
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker(
      SCHEDULER_EXECUTION_QUEUE_NAME,
      (job, token) => this.execute(job, token),
      {
        connection: this.connection,
        concurrency: resolveDbPoolRuntimeConfig().schedulerMaxConcurrentRuns,
        drainDelay: runtime.drainDelay,
        stalledInterval: runtime.stalledInterval,
      },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `scheduler_occurrence_attempt_failed occurrenceId=${job?.data.occurrenceId ?? ''} error=${error.message}`,
      );
    });
    this.logger.log(
      `scheduler_execution_worker_started concurrency=${resolveDbPoolRuntimeConfig().schedulerMaxConcurrentRuns} replicaInvariant=single`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    this.worker = null;
    await closeRedisConnection(this.connection);
    this.connection = null;
  }

  /** Visible for tests. Production calls this from the BullMQ worker. */
  async execute(job: Job<SchedulerExecutionPayload>, token?: string): Promise<void> {
    const claimed = await this.occurrences.claimRunning(job.data.occurrenceId);
    if (!claimed) {
      await this.deferUnclaimed(job, token);
      return;
    }
    try {
      await this.runClaimed(job, token);
    } catch (caught) {
      if (caught instanceof DelayedError) throw caught;
      await this.failOrRethrow(job, caught);
    }
  }

  private async runClaimed(job: Job<SchedulerExecutionPayload>, token?: string): Promise<void> {
    const result = (await runSchedulerJobByName(
      { scheduler: this.scheduler, ai: this.ai },
      job.data.jobName,
      job.data.trigger as SchedulerTrigger,
      { scheduledFor: new Date(job.data.scheduledFor) },
    )) as LeaseRunResult;
    if (result?.status === SCHEDULER_RUN_STATUS.SKIPPED_LOCKED) {
      await this.deferForLease(job, token);
      return;
    }
    if (isTerminalLeaseFailure(result?.status)) {
      await this.occurrences.markFailed(
        job.data.occurrenceId,
        new Error(result?.status ?? 'FAILED'),
      );
      return;
    }
    await this.occurrences.markSucceeded(job.data.occurrenceId);
  }

  private async deferForLease(job: Job<SchedulerExecutionPayload>, token?: string): Promise<void> {
    const scheduledFor = new Date(job.data.scheduledFor);
    await this.occurrences.releaseToQueue(job.data.occurrenceId, job.data.jobName, scheduledFor);
    await this.delayJob(job, token);
  }

  private async deferUnclaimed(job: Job<SchedulerExecutionPayload>, token?: string): Promise<void> {
    const status = await this.occurrences.readStatus(job.data.occurrenceId);
    if (isTerminalOccurrence(status)) return;
    await this.delayJob(job, token);
  }

  private async delayJob(job: Job<SchedulerExecutionPayload>, token?: string): Promise<void> {
    await job.moveToDelayed(Date.now() + SCHEDULER_LEASE_RETRY_DELAY_MS, token);
    throw new DelayedError();
  }

  private async failOrRethrow(job: Job<SchedulerExecutionPayload>, caught: unknown): Promise<void> {
    const attempts = job.opts.attempts ?? 1;
    const isLast = job.attemptsMade + 1 >= attempts;
    if (!isLast) {
      await this.occurrences.markPending(job.data.occurrenceId);
      throw caught;
    }
    await this.occurrences.markFailed(job.data.occurrenceId, caught);
  }
}

function isTerminalLeaseFailure(status: string | undefined): boolean {
  return status === SCHEDULER_RUN_STATUS.FAILED || status === SCHEDULER_RUN_STATUS.TIMED_OUT;
}

function isTerminalOccurrence(status: string | null): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELLED' || status === null;
}
