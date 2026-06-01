import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../../common/redis/redis-connection';
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
    const redisUrl = getRedisUrl();
    if (!redisUrl) return;
    this.connection = createRedisConnection(redisUrl);
    this.queue = new Queue<DriveZipExportQueuePayload>(DRIVE_ZIP_EXPORT_QUEUE_NAME, {
      connection: this.connection,
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    await this.connection?.quit();
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
