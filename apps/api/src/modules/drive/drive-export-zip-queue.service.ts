import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { BULLMQ_EXPORT_JOB_OPTIONS } from '../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../runtime/process-role';
import { createQueueProducerConnection, getRedisQueueUrl } from '../../runtime/queue-redis';
import {
  DRIVE_ZIP_EXPORT_JOB_NAME,
  DRIVE_ZIP_EXPORT_QUEUE_NAME,
  type DriveZipExportQueuePayload,
} from './drive-export-zip-queue.constants';

@Injectable()
export class DriveExportZipQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DriveExportZipQueueService.name);
  private queue: Queue<DriveZipExportQueuePayload> | null = null;
  private connection: Redis | null = null;

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) return;
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue<DriveZipExportQueuePayload>(DRIVE_ZIP_EXPORT_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_EXPORT_JOB_OPTIONS,
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    this.queue = null;
    await this.connection?.quit();
    this.connection = null;
  }

  isQueueAvailable(): boolean {
    return this.queue !== null;
  }

  async enqueue(payload: DriveZipExportQueuePayload): Promise<boolean> {
    if (!this.queue) return false;
    try {
      await this.queue.add(DRIVE_ZIP_EXPORT_JOB_NAME, payload, { jobId: payload.jobId });
      return true;
    } catch (caught) {
      this.logger.error('Failed to enqueue Drive ZIP export job.', caught);
      return false;
    }
  }
}
