import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { toBullMqSafeJobId } from '@nbos/shared';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueProducerConnection,
  createQueueWorkerConnection,
  getRedisQueueUrl,
} from '../../../runtime/queue-redis';
import { throwWhatsAppDomainError } from './whatsapp-gateway.errors';
import {
  WHATSAPP_ERROR,
  WHATSAPP_OUTBOUND_JOB_NAME,
  WHATSAPP_OUTBOUND_QUEUE_NAME,
  WHATSAPP_OUTBOUND_WAIT_TIMEOUT_MS,
} from './whatsapp-gateway.constants';
import type { WhatsAppOutboundJobPayload } from './whatsapp-outbound.types';

@Injectable()
export class WhatsAppOutboundQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppOutboundQueueService.name);
  private queue: Queue<WhatsAppOutboundJobPayload> | null = null;
  private queueEvents: QueueEvents | null = null;
  private connection: ReturnType<typeof createQueueProducerConnection> | null = null;
  private eventsConnection: ReturnType<typeof createQueueWorkerConnection> | null = null;

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_QUEUE_URL/REDIS_URL unset — WhatsApp outbound queue disabled');
      return;
    }
    this.connection = createQueueProducerConnection(redisUrl);
    this.eventsConnection = createQueueWorkerConnection(redisUrl);
    this.queue = new Queue<WhatsAppOutboundJobPayload>(WHATSAPP_OUTBOUND_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: BULLMQ_CRITICAL_JOB_OPTIONS,
    });
    this.queueEvents = new QueueEvents(WHATSAPP_OUTBOUND_QUEUE_NAME, {
      connection: this.eventsConnection,
    });
  }

  async onModuleDestroy() {
    await this.queueEvents?.close();
    this.queueEvents = null;
    await this.queue?.close();
    this.queue = null;
    await closeRedisConnection(this.connection);
    this.connection = null;
    await closeRedisConnection(this.eventsConnection);
    this.eventsConnection = null;
  }

  isAvailable(): boolean {
    return this.queue != null && this.queueEvents != null;
  }

  async enqueue(payload: WhatsAppOutboundJobPayload, wait: boolean): Promise<void> {
    if (!this.queue || !this.queueEvents) {
      throwWhatsAppDomainError(
        503,
        WHATSAPP_ERROR.OUTBOUND_QUEUE_UNAVAILABLE,
        'WhatsApp outbound queue is not available',
      );
    }
    const jobId = toBullMqSafeJobId(payload.idempotencyKey);
    const existing = await this.queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === 'completed') return;
      if (state === 'failed') {
        await existing.remove();
      } else if (wait) {
        await existing.waitUntilFinished(this.queueEvents, WHATSAPP_OUTBOUND_WAIT_TIMEOUT_MS);
        return;
      } else {
        return;
      }
    }
    const job = await this.queue.add(WHATSAPP_OUTBOUND_JOB_NAME, payload, { jobId });
    if (wait) {
      await job.waitUntilFinished(this.queueEvents, WHATSAPP_OUTBOUND_WAIT_TIMEOUT_MS);
    }
  }
}
