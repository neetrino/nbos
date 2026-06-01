import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../../common/redis/redis-connection';
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

  constructor(private readonly reportsService: ReportsService) {}

  onModuleInit() {
    const redisUrl = getRedisUrl();
    if (!redisUrl) return;
    this.connection = createRedisConnection(redisUrl);
    this.worker = new Worker<ReportExportQueuePayload>(
      REPORT_EXPORT_QUEUE_NAME,
      async (job) => {
        if (job.name !== REPORT_EXPORT_JOB_NAME) return;
        await this.reportsService.processExportJob(job.data.jobId, job.data.actorId);
      },
      { connection: this.connection },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Report export worker failed for BullMQ job ${job?.id ?? 'unknown'}.`,
        error,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
