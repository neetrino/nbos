import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { buildProductWhatsAppCreateDedupeKey, toBullMqSafeJobId } from '@nbos/shared';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../../runtime/process-role';
import { createQueueProducerConnection, getRedisQueueUrl } from '../../../runtime/queue-redis';
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
  private connection: ReturnType<typeof createQueueProducerConnection> | null = null;

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_QUEUE_URL/REDIS_URL unset — WhatsApp product group queue disabled');
      return;
    }
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue<WhatsAppProductGroupJobPayload>(WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_CRITICAL_JOB_OPTIONS,
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    this.queue = null;
    await this.connection?.quit();
    this.connection = null;
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
