import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueProducerConnection,
  getRedisQueueUrl,
} from '../../runtime/queue-redis';
import {
  SCHEDULER_EXECUTION_JOB_NAME,
  SCHEDULER_EXECUTION_QUEUE_NAME,
  schedulerExecutionJobId,
} from './scheduler-occurrence.constants';
import { mapBullMqJobState, type SchedulerQueueJobState } from './scheduler-occurrence.policy';
import type { SchedulerTrigger } from './scheduler-lease.constants';

export type SchedulerExecutionPayload = {
  occurrenceId: string;
  jobName: string;
  trigger: SchedulerTrigger;
  scheduledFor: string;
};

export type SchedulerEnqueueResult = 'queued' | 'present' | 'completed';

@Injectable()
export class SchedulerExecutionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerExecutionQueueService.name);
  private queue: Queue<SchedulerExecutionPayload> | null = null;
  private connection: ReturnType<typeof createQueueProducerConnection> | null = null;

  onModuleInit(): void {
    if (!shouldRegisterQueueProducers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_QUEUE_URL/REDIS_URL unset — scheduler execution queue disabled');
      return;
    }
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue(SCHEDULER_EXECUTION_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_CRITICAL_JOB_OPTIONS,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
    this.queue = null;
    await closeRedisConnection(this.connection);
    this.connection = null;
  }

  isAvailable(): boolean {
    return this.queue != null;
  }

  async enqueue(payload: SchedulerExecutionPayload): Promise<SchedulerEnqueueResult> {
    const queue = this.requireQueue();
    const jobId = schedulerExecutionJobId(payload.jobName, new Date(payload.scheduledFor));
    const existing = await queue.getJob(jobId);
    if (existing) return this.reuseExisting(existing);
    await queue.add(SCHEDULER_EXECUTION_JOB_NAME, payload, { jobId });
    return 'queued';
  }

  async describe(jobName: string, scheduledFor: Date): Promise<SchedulerQueueJobState> {
    if (!this.queue) return 'missing';
    const existing = await this.queue.getJob(schedulerExecutionJobId(jobName, scheduledFor));
    if (!existing) return 'missing';
    return mapBullMqJobState(await existing.getState());
  }

  private requireQueue(): Queue<SchedulerExecutionPayload> {
    if (!this.queue) {
      throw new Error('SCHEDULER_QUEUE_UNAVAILABLE');
    }
    return this.queue;
  }

  private async reuseExisting(existing: {
    getState: () => Promise<string>;
    retry: () => Promise<void>;
  }): Promise<SchedulerEnqueueResult> {
    const state = mapBullMqJobState(await existing.getState());
    if (state === 'failed') {
      await existing.retry();
      return 'queued';
    }
    if (state === 'completed') return 'completed';
    return 'present';
  }
}
