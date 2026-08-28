import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { BullmqWorkerRegistry } from '../../../runtime/bullmq-worker-registry';
import { resolveBullmqWorkerRuntimeOptions } from '../../../runtime/bullmq-worker-runtime';
import { logBullmqJob } from '../../../runtime/bullmq-job-log';
import { shouldRegisterBullmqWorkers } from '../../../runtime/process-role';
import {
  closeRedisConnection,
  createQueueWorkerConnection,
  getRedisQueueUrl,
} from '../../../runtime/queue-redis';
import { OpsJobFailureAlertService } from '../../ops-alerts/ops-job-failure-alert.service';
import {
  cancelOfficialInvoiceRequest,
  sendOfficialInvoiceRequest,
} from '../../finance/invoices/invoice-official-request';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import {
  WHATSAPP_OUTBOUND_JOB_NAME,
  WHATSAPP_OUTBOUND_QUEUE_NAME,
} from './whatsapp-gateway.constants';
import { waitWhatsAppOutboundGap } from './whatsapp-outbound-gap';
import type { WhatsAppOutboundJobPayload } from './whatsapp-outbound.types';

@Injectable()
export class WhatsAppOutboundMessagesWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppOutboundMessagesWorker.name);
  private worker: Worker<WhatsAppOutboundJobPayload> | null = null;
  private connection: ReturnType<typeof createQueueWorkerConnection> | null = null;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly connectionService: WhatsAppGatewayConnectionService,
    private readonly client: WhatsAppGatewayClient,
    private readonly registry: BullmqWorkerRegistry,
    @Optional() private readonly opsAlerts?: OpsJobFailureAlertService,
  ) {}

  onModuleInit() {
    if (!shouldRegisterBullmqWorkers()) return;
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_QUEUE_URL/REDIS_URL unset — WhatsApp outbound worker disabled');
      return;
    }
    this.connection = createQueueWorkerConnection(redisUrl);
    this.worker = new Worker<WhatsAppOutboundJobPayload>(
      WHATSAPP_OUTBOUND_QUEUE_NAME,
      async (job) => this.runLogged(job),
      { connection: this.connection, concurrency: 1, ...resolveBullmqWorkerRuntimeOptions() },
    );
    this.registry.register(WHATSAPP_OUTBOUND_QUEUE_NAME);
    this.worker.on('failed', (job, error) => {
      this.logger.error(`WhatsApp outbound failed jobId=${job?.id}`, error);
      void this.opsAlerts?.notifyIfBullmqFinallyFailed(WHATSAPP_OUTBOUND_QUEUE_NAME, job, error);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.worker = null;
    await closeRedisConnection(this.connection);
    this.connection = null;
  }

  private async runLogged(job: Job<WhatsAppOutboundJobPayload>): Promise<void> {
    const started = Date.now();
    try {
      await this.process(job);
      logBullmqJob(this.logger, {
        queue: WHATSAPP_OUTBOUND_QUEUE_NAME,
        jobName: job.name || WHATSAPP_OUTBOUND_JOB_NAME,
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'completed',
      });
    } catch (error) {
      logBullmqJob(this.logger, {
        queue: WHATSAPP_OUTBOUND_QUEUE_NAME,
        jobName: job.name,
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        durationMs: Date.now() - started,
        status: 'failed',
        errorCode: error instanceof Error ? error.name : 'Error',
      });
      throw error;
    }
  }

  async process(job: Job<WhatsAppOutboundJobPayload>): Promise<void> {
    try {
      const config = await this.connectionService.requireClientConfig();
      await this.client.sendTextMessage(
        config,
        { chatId: job.data.chatId, text: job.data.text },
        job.data.idempotencyKey,
      );
      await this.applySideEffects(job.data);
    } finally {
      await waitWhatsAppOutboundGap();
    }
  }

  private async applySideEffects(data: WhatsAppOutboundJobPayload): Promise<void> {
    if (data.kind === 'official_send' && data.invoiceId) {
      await sendOfficialInvoiceRequest(this.prisma, data.invoiceId);
      return;
    }
    if (data.kind === 'official_cancel' && data.invoiceId) {
      await cancelOfficialIfActive(this.prisma, data.invoiceId);
      return;
    }
    if (
      (data.kind === 'payment_reminder' || data.kind === 'overdue_reminder') &&
      data.notificationJobId
    ) {
      await markPaymentReminderDelivered(this.prisma, data);
    }
  }
}

async function cancelOfficialIfActive(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
): Promise<void> {
  const row = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { officialInvoiceRequestSent: true },
  });
  if (!row?.officialInvoiceRequestSent) return;
  await cancelOfficialInvoiceRequest(prisma, invoiceId);
}

async function markPaymentReminderDelivered(
  prisma: InstanceType<typeof PrismaClient>,
  data: WhatsAppOutboundJobPayload,
): Promise<void> {
  if (!data.notificationJobId) return;
  await prisma.notificationDelivery.create({
    data: {
      jobId: data.notificationJobId,
      channel: 'WHATSAPP',
      recipient: data.chatId,
      status: 'DELIVERED',
      provider: 'whatsapp_gateway',
      sentAt: new Date(),
      deliveredAt: new Date(),
    },
  });
  await prisma.notificationJob.update({
    where: { id: data.notificationJobId },
    data: { status: 'DELIVERED', processedAt: new Date() },
  });
}
