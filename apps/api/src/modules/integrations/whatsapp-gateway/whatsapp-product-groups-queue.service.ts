import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { buildProductWhatsAppCreateDedupeKey, toBullMqSafeJobId } from '@nbos/shared';
import { createRedisConnection, getRedisUrl } from '../../../common/redis/redis-connection';
import {
  WHATSAPP_PRODUCT_GROUP_JOB_NAME,
  WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
} from './whatsapp-gateway.constants';

export interface WhatsAppProductGroupJobPayload {
  operationId: string;
}

@Injectable()
export class WhatsAppProductGroupsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppProductGroupsQueueService.name);
  private queue: Queue<WhatsAppProductGroupJobPayload> | null = null;
  private connection: ReturnType<typeof createRedisConnection> | null = null;

  onModuleInit() {
    const redisUrl = getRedisUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_URL unset — WhatsApp product group queue disabled');
      return;
    }
    this.connection = createRedisConnection(redisUrl);
    this.queue = new Queue<WhatsAppProductGroupJobPayload>(WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    await this.connection?.quit();
  }

  isQueueAvailable(): boolean {
    return this.queue != null;
  }

  async enqueueOperation(operationId: string, businessDedupeKey: string): Promise<boolean> {
    if (!this.queue) {
      return false;
    }
    // Prefer operation-scoped job id so FAILED Redis jobs do not block Retry
    // (stable business dedupe lives in DB, not BullMQ jobId).
    return this.addJob(
      operationId,
      toBullMqSafeJobId(`whatsapp-op:${operationId}`),
      businessDedupeKey,
    );
  }

  /** Used by scheduler when re-enqueueing without relying on create-key uniqueness. */
  async enqueueOperationById(operationId: string): Promise<boolean> {
    if (!this.queue) return false;
    return this.addJob(operationId, toBullMqSafeJobId(`whatsapp-op:${operationId}`));
  }

  private async addJob(
    operationId: string,
    jobId: string,
    businessDedupeKey?: string,
  ): Promise<boolean> {
    if (!this.queue) return false;
    try {
      const existing = await this.queue.getJob(jobId);
      if (existing) {
        const state = await existing.getState();
        if (
          state === 'waiting' ||
          state === 'active' ||
          state === 'delayed' ||
          state === 'prioritized' ||
          state === 'waiting-children'
        ) {
          return true;
        }
        if (state === 'completed' || state === 'failed') {
          await existing.remove();
        }
      }
      await this.queue.add(WHATSAPP_PRODUCT_GROUP_JOB_NAME, { operationId }, { jobId });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Job is already') || message.toLowerCase().includes('exists')) {
        return true;
      }
      this.logger.error(
        `Failed to enqueue WhatsApp operation ${operationId}${businessDedupeKey ? ` (${businessDedupeKey})` : ''}`,
        error,
      );
      return false;
    }
  }
}

export { buildProductWhatsAppCreateDedupeKey };
