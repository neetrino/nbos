import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { buildProductWhatsAppCreateDedupeKey, toBullMqSafeJobId } from '@nbos/shared';
import {
  DEAL_WHATSAPP_CREATE_JOB_KIND,
  type DealWhatsAppCreateJobPayload,
} from './deal-whatsapp-group.types';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueProducerConnection,
  getRedisQueueUrl,
} from '../../../runtime/queue-redis';
import {
  WHATSAPP_PRODUCT_GROUP_JOB_NAME,
  WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
} from './whatsapp-gateway.constants';

export type WhatsAppProductGroupJobPayload =
  | { operationId: string; kind?: undefined }
  | DealWhatsAppCreateJobPayload;

export function isDealWhatsAppCreateJob(
  data: WhatsAppProductGroupJobPayload,
): data is DealWhatsAppCreateJobPayload {
  return data.kind === DEAL_WHATSAPP_CREATE_JOB_KIND;
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
    await closeRedisConnection(this.connection);
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
      { operationId },
      toBullMqSafeJobId(`whatsapp-op:${operationId}`),
      businessDedupeKey,
    );
  }

  async enqueueDealCreate(bindingId: string, businessDedupeKey: string): Promise<boolean> {
    if (!this.queue) return false;
    return this.addJob(
      { kind: DEAL_WHATSAPP_CREATE_JOB_KIND, bindingId },
      toBullMqSafeJobId(`whatsapp-deal-create:${bindingId}`),
      businessDedupeKey,
    );
  }

  /** Used by scheduler when re-enqueueing without relying on create-key uniqueness. */
  async enqueueOperationById(operationId: string): Promise<boolean> {
    if (!this.queue) return false;
    return this.addJob({ operationId }, toBullMqSafeJobId(`whatsapp-op:${operationId}`));
  }

  private async addJob(
    payload: WhatsAppProductGroupJobPayload,
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
      await this.queue.add(WHATSAPP_PRODUCT_GROUP_JOB_NAME, payload, { jobId });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Job is already') || message.toLowerCase().includes('exists')) {
        return true;
      }
      this.logger.error(
        `Failed to enqueue WhatsApp job ${jobId}${businessDedupeKey ? ` (${businessDedupeKey})` : ''}`,
        error,
      );
      return false;
    }
  }
}

export { buildProductWhatsAppCreateDedupeKey };
