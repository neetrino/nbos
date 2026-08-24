import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueProducerConnection,
  getRedisQueueUrl,
} from '../../../runtime/queue-redis';
import {
  ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME,
  ATS_CALL_RECORDING_QUEUE_NAME,
  ATS_CALL_RECORDING_REPROCESS_JOB_NAME,
  type AtsCallRecordingJobPayload,
} from './ats-call-recording.constants';
import { atsCallRecordingJobId, atsCallRecordingReprocessJobId } from './ats-call-recording-job-id';

const IN_FLIGHT_STATES = new Set([
  'waiting',
  'active',
  'delayed',
  'prioritized',
  'waiting-children',
]);

@Injectable()
export class AtsCallRecordingQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AtsCallRecordingQueueService.name);
  private queue: Queue<AtsCallRecordingJobPayload> | null = null;
  private connection: Redis | null = null;

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) return;
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue<AtsCallRecordingJobPayload>(ATS_CALL_RECORDING_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_CRITICAL_JOB_OPTIONS,
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    this.queue = null;
    await closeRedisConnection(this.connection);
    this.connection = null;
  }

  isQueueAvailable(): boolean {
    return this.queue !== null;
  }

  async enqueueDownload(payload: AtsCallRecordingJobPayload): Promise<boolean> {
    if (!this.queue) return false;
    try {
      const jobId = atsCallRecordingJobId(payload.callId);
      const prepared = await prepareRecordingJobId(this.queue, jobId);
      if (prepared === 'in_flight') return true;
      await this.queue.add(ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME, payload, { jobId });
      return true;
    } catch (caught) {
      if (isDuplicateJobError(caught)) return true;
      const detail = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Failed to enqueue ATS recording job: ${detail}`);
      return false;
    }
  }

  async enqueueReprocess(payload: AtsCallRecordingJobPayload): Promise<boolean> {
    if (!this.queue) return false;
    try {
      const jobId = atsCallRecordingReprocessJobId(payload.callId);
      const prepared = await prepareRecordingJobId(this.queue, jobId);
      if (prepared === 'in_flight') return true;
      await this.queue.add(ATS_CALL_RECORDING_REPROCESS_JOB_NAME, payload, { jobId });
      return true;
    } catch (caught) {
      if (isDuplicateJobError(caught)) return true;
      const detail = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Failed to enqueue ATS recording reprocess job: ${detail}`);
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

async function prepareRecordingJobId(
  queue: Queue<AtsCallRecordingJobPayload>,
  jobId: string,
): Promise<'in_flight' | 'ready'> {
  const existing = await queue.getJob(jobId);
  if (!existing) return 'ready';
  const state = await existing.getState();
  if (IN_FLIGHT_STATES.has(state)) return 'in_flight';
  if (state === 'completed' || state === 'failed') {
    await existing.remove();
  }
  return 'ready';
}
