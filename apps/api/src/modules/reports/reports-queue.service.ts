import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { BULLMQ_EXPORT_JOB_OPTIONS } from '../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueProducerConnection,
  getRedisQueueUrl,
} from '../../runtime/queue-redis';
import {
  REPORT_EXPORT_JOB_NAME,
  REPORT_EXPORT_QUEUE_NAME,
  type ReportExportQueuePayload,
} from './reports-queue.constants';

@Injectable()
export class ReportsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsQueueService.name);
  private queue: Queue<ReportExportQueuePayload> | null = null;
  private connection: Redis | null = null;

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) return;
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue<ReportExportQueuePayload>(REPORT_EXPORT_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_EXPORT_JOB_OPTIONS,
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

  async enqueueExport(payload: ReportExportQueuePayload): Promise<boolean> {
    if (!this.queue) return false;
    try {
      await this.queue.add(REPORT_EXPORT_JOB_NAME, payload, { jobId: payload.jobId });
      return true;
    } catch (caught) {
      this.logger.error('Failed to enqueue report export job.', caught);
      return false;
    }
  }
}
