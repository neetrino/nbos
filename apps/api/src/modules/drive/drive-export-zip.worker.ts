import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
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

  constructor(private readonly driveZipExports: DriveZipExportService) {}

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;
    this.connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.worker = new Worker<DriveZipExportQueuePayload>(
      DRIVE_ZIP_EXPORT_QUEUE_NAME,
      async (job) => {
        if (job.name !== DRIVE_ZIP_EXPORT_JOB_NAME) return;
        await this.driveZipExports.processZipExportJob(job.data.jobId, job.data.actorId);
      },
      { connection: this.connection },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Drive ZIP export worker failed for BullMQ job ${job?.id ?? 'unknown'}.`,
        error,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
