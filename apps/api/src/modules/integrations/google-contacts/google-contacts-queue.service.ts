import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaClient } from '@nbos/database';
import { toBullMqSafeJobId } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { BULLMQ_CRITICAL_JOB_OPTIONS } from '../../../runtime/bullmq-job-options';
import { shouldRegisterQueueProducers } from '../../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueProducerConnection,
  getRedisQueueUrl,
} from '../../../runtime/queue-redis';
import { canEnqueueGoogleContactsSync } from './google-contacts-connection-state';
import {
  GOOGLE_CONTACTS_CONNECTION_ID,
  GOOGLE_CONTACTS_JOB_NAME,
  GOOGLE_CONTACTS_QUEUE_NAME,
} from './google-contacts.constants';
import type { GoogleContactsJobPayload } from './google-contacts.types';

@Injectable()
export class GoogleContactsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GoogleContactsQueueService.name);
  private queue: Queue<GoogleContactsJobPayload> | null = null;
  private connection: ReturnType<typeof createQueueProducerConnection> | null = null;

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  onModuleInit() {
    if (!shouldRegisterQueueProducers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_QUEUE_URL/REDIS_URL unset — Google Contacts queue disabled');
      return;
    }
    this.connection = createQueueProducerConnection(redisUrl);
    this.queue = new Queue<GoogleContactsJobPayload>(GOOGLE_CONTACTS_QUEUE_NAME, {
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

  isAvailable(): boolean {
    return this.queue != null;
  }

  /**
   * Enqueue a contact sync when the org Google account is connected.
   * No-ops when disconnected or Redis is down — CRM writes must not fail.
   */
  async enqueueContact(contactId: string): Promise<boolean> {
    if (!this.queue) return false;
    if (!(await this.canEnqueue())) return false;
    const jobId = toBullMqSafeJobId(`google-contacts:${contactId}`);
    try {
      const existing = await this.queue.getJob(jobId);
      if (existing) {
        const state = await existing.getState();
        if (state === 'completed') {
          await existing.remove();
        } else if (state === 'failed') {
          await existing.remove();
        } else {
          return false;
        }
      }
      await this.queue.add(GOOGLE_CONTACTS_JOB_NAME, { contactId }, { jobId });
      return true;
    } catch (error) {
      this.logger.warn(
        `Google Contacts enqueue failed contactId=${contactId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return false;
  }

  async enqueueAllActiveContacts(): Promise<{ enqueued: number }> {
    if (!this.queue) return { enqueued: 0 };
    if (!(await this.canEnqueue())) return { enqueued: 0 };
    const contacts = await this.prisma.contact.findMany({
      where: { trashedAt: null, mergedIntoId: null },
      select: { id: true },
    });
    let enqueued = 0;
    for (const contact of contacts) {
      if (await this.enqueueContact(contact.id)) {
        enqueued += 1;
      }
    }
    return { enqueued };
  }

  private async canEnqueue(): Promise<boolean> {
    const row = await this.prisma.googleContactsConnection.findUnique({
      where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
      select: { status: true, secret: { select: { id: true } } },
    });
    return row != null && canEnqueueGoogleContactsSync(row);
  }
}
