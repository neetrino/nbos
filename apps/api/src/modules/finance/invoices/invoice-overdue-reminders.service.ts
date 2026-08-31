import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient, type SubscriptionReminderLanguage } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { isOfficialRequestBlockingTaxReminders } from './invoice-official-request';
import { tryDeliverPaymentReminderWhatsApp } from './invoice-payment-reminder-whatsapp';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import { overdueReminderSelect } from './invoice-overdue-reminder-selects';
import { decideOverdueReminderAction } from './invoice-overdue-reminder-decide';
import { resolveOverdueReminderRenderInput } from './invoice-overdue-reminder-render';
import { renderOverdueReminderMessage } from './invoice-overdue-reminder-templates';
import {
  buildOverdueReminderDedupeKey,
  buildOverdueReminderIdempotencyKey,
  overdueReminderEventTypeForWave,
  OVERDUE_REMINDER_WAVES,
  parseOverdueReminderDedupeKey,
  type OverdueReminderSkipReason,
  type OverdueReminderWave,
} from './invoice-overdue-reminder.constants';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';

type OverdueCandidate = {
  id: string;
  code: string;
  amount: unknown;
  dueDate: Date | null;
  coverageStartMonth: string | null;
  taxStatus: string;
  moneyStatus: string;
  officialInvoiceRequestSent: boolean;
  notificationsEnabled: boolean;
  company: { name: string } | null;
  clientServiceRecord: {
    notificationsEnabled: boolean;
    reminderLanguage: SubscriptionReminderLanguage;
    productId: string | null;
    name: string;
    product: { id: string; name: string } | null;
  } | null;
  subscription: {
    name: string;
    code: string;
    productId: string;
    notificationsEnabled: boolean;
    reminderLanguage: SubscriptionReminderLanguage;
    product: { id: string; name: string };
  } | null;
};

export interface OverdueReminderItem {
  invoiceId: string;
  code: string;
  wave: OverdueReminderWave;
}

export interface OverdueReminderSkipItem {
  invoiceId: string;
  code: string;
  reason: OverdueReminderSkipReason;
}

export interface OverdueReminderPreviewResult {
  asOf: string;
  asOfYerevan: string;
  wave1Count: number;
  wave2Count: number;
  sendable: OverdueReminderItem[];
  skipped: OverdueReminderSkipItem[];
}

export interface OverdueReminderRunResult extends OverdueReminderPreviewResult {
  sent: OverdueReminderItem[];
}

interface WaveJobState {
  wave1ScheduledFor: Date | null;
  hasWave2: boolean;
}

interface ClassifiedSendable {
  invoice: OverdueCandidate;
  wave: OverdueReminderWave;
  groupChatId: string;
  productId: string;
}

interface ClassifiedBatch {
  asOf: Date;
  asOfKey: string;
  sendable: ClassifiedSendable[];
  skipped: OverdueReminderSkipItem[];
}

@Injectable()
export class InvoiceOverdueRemindersService {
  private readonly logger = new Logger(InvoiceOverdueRemindersService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly outbound?: WhatsAppOutboundQueueService,
  ) {}

  async preview(params: { asOf?: Date } = {}): Promise<OverdueReminderPreviewResult> {
    try {
      return toPreviewPayload(await this.classify(params.asOf ?? new Date()));
    } catch (error) {
      this.logger.error(
        `Overdue reminder preview failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async run(params: { asOf?: Date } = {}): Promise<OverdueReminderRunResult> {
    const classified = await this.classify(params.asOf ?? new Date());
    const sent: OverdueReminderItem[] = [];
    const skipped = [...classified.skipped];
    for (const item of classified.sendable) {
      const result = await this.sendWave(item, classified.asOf, classified.asOfKey);
      if (result.kind === 'sent') {
        sent.push({ invoiceId: item.invoice.id, code: item.invoice.code, wave: item.wave });
        continue;
      }
      skipped.push({ invoiceId: item.invoice.id, code: item.invoice.code, reason: result.reason });
    }
    return { ...toPreviewPayload(classified), sent, skipped };
  }

  private async classify(asOf: Date): Promise<ClassifiedBatch> {
    const asOfKey = yerevanCalendarDateKey(asOf);
    const invoices = await this.findCandidates();
    const jobsByInvoice = await this.loadWaveJobs(invoices.map((invoice) => invoice.id));
    const sendable: ClassifiedSendable[] = [];
    const skipped: OverdueReminderSkipItem[] = [];
    for (const invoice of invoices) {
      const row = await this.classifyOne(invoice, jobsByInvoice.get(invoice.id), asOfKey);
      if (row.kind === 'send') sendable.push(row);
      else skipped.push(row.skip);
    }
    return { asOf, asOfKey, sendable, skipped };
  }

  private findCandidates() {
    return this.prisma.invoice.findMany({
      where: {
        moneyStatus: 'OVERDUE',
        OR: [{ subscriptionId: { not: null } }, { clientServiceRecordId: { not: null } }],
      },
      select: overdueReminderSelect,
    });
  }

  private async loadWaveJobs(invoiceIds: string[]): Promise<Map<string, WaveJobState>> {
    const states = new Map<string, WaveJobState>();
    for (const invoiceId of invoiceIds) {
      states.set(invoiceId, { wave1ScheduledFor: null, hasWave2: false });
    }
    if (invoiceIds.length === 0) return states;
    const keys = invoiceIds.flatMap((invoiceId) =>
      OVERDUE_REMINDER_WAVES.map((wave) => buildOverdueReminderDedupeKey(invoiceId, wave)),
    );
    const jobs = await this.prisma.notificationJob.findMany({
      where: { dedupeKey: { in: keys } },
      select: { dedupeKey: true, scheduledFor: true },
    });
    for (const job of jobs) {
      applyWaveJob(states, job.dedupeKey, job.scheduledFor);
    }
    return states;
  }

  private async classifyOne(
    invoice: OverdueCandidate,
    jobs: WaveJobState | undefined,
    asOfKey: string,
  ): Promise<
    ({ kind: 'send' } & ClassifiedSendable) | { kind: 'skip'; skip: OverdueReminderSkipItem }
  > {
    const productWhatsApp = await resolveInvoiceProductWhatsAppGroup(this.prisma, invoice.id);
    const decision = decideOverdueReminderAction({
      moneyStatus: invoice.moneyStatus,
      hasProductLink: invoice.subscription != null || invoice.clientServiceRecord != null,
      notificationsEnabled: isOverdueNotificationsEnabled(invoice),
      taxBlocked: isOfficialRequestBlockingTaxReminders(invoice),
      hasWhatsAppGroup: Boolean(productWhatsApp?.groupChatId),
      wave1ScheduledFor: jobs?.wave1ScheduledFor ?? null,
      hasWave2: jobs?.hasWave2 ?? false,
      asOfKey,
    });
    if (decision.kind === 'skip') {
      if (decision.reason === 'no_whatsapp') {
        this.logger.warn(
          `Overdue reminder skipped (no Product WhatsApp group): invoice=${invoice.code}`,
        );
      }
      return {
        kind: 'skip',
        skip: { invoiceId: invoice.id, code: invoice.code, reason: decision.reason },
      };
    }
    return {
      kind: 'send',
      invoice,
      wave: decision.wave,
      groupChatId: productWhatsApp?.groupChatId ?? '',
      productId: productWhatsApp?.productId ?? '',
    };
  }

  private async sendWave(
    item: ClassifiedSendable,
    asOf: Date,
    asOfKey: string,
  ): Promise<{ kind: 'sent' } | { kind: 'skip'; reason: OverdueReminderSkipReason }> {
    const type = overdueReminderEventTypeForWave(item.wave);
    const dedupeKey = buildOverdueReminderDedupeKey(item.invoice.id, item.wave);
    const existing = await this.prisma.notificationJob.findUnique({ where: { dedupeKey } });
    if (existing) return { kind: 'skip', reason: 'already_sent' };
    const resolved = resolveOverdueReminderRenderInput({
      code: item.invoice.code,
      amount: item.invoice.amount,
      taxStatus: item.invoice.taxStatus,
      coverageStartMonth: item.invoice.coverageStartMonth,
      dueDate: item.invoice.dueDate,
      wave: item.wave,
      subscription: item.invoice.subscription,
      clientServiceRecord: item.invoice.clientServiceRecord,
    });
    if (resolved == null) return { kind: 'skip', reason: 'no_product_link' };
    const messageText = renderOverdueReminderMessage(resolved.renderInput);
    const job = await createInvoiceReminderNotificationJob(this.prisma, {
      type,
      invoiceId: item.invoice.id,
      dedupeKey,
      idempotencyKey: buildOverdueReminderIdempotencyKey(item.invoice.id, item.wave),
      scheduledFor: asOf,
      payload: buildOverdueJobPayload(item, resolved, messageText, asOf, asOfKey),
    });
    await tryDeliverPaymentReminderWhatsApp({
      prisma: this.prisma,
      outbound: this.outbound,
      jobId: job.jobId,
      chatId: item.groupChatId,
      text: messageText,
      idempotencyKey: dedupeKey,
      kind: 'overdue_reminder',
    });
    return { kind: 'sent' };
  }
}

function toPreviewPayload(batch: ClassifiedBatch): OverdueReminderPreviewResult {
  const sendable = batch.sendable.map((item) => ({
    invoiceId: item.invoice.id,
    code: item.invoice.code,
    wave: item.wave,
  }));
  return {
    asOf: batch.asOf.toISOString(),
    asOfYerevan: batch.asOfKey,
    wave1Count: sendable.filter((item) => item.wave === 1).length,
    wave2Count: sendable.filter((item) => item.wave === 2).length,
    sendable,
    skipped: batch.skipped,
  };
}

function applyWaveJob(
  states: Map<string, WaveJobState>,
  dedupeKey: string,
  scheduledFor: Date,
): void {
  const parsed = parseOverdueReminderDedupeKey(dedupeKey);
  if (!parsed) return;
  const state = states.get(parsed.invoiceId);
  if (!state) return;
  if (parsed.wave === 1) state.wave1ScheduledFor = scheduledFor;
  else state.hasWave2 = true;
}

function buildOverdueJobPayload(
  item: ClassifiedSendable,
  resolved: { productName: string; language: SubscriptionReminderLanguage },
  messageText: string,
  asOf: Date,
  asOfKey: string,
) {
  return {
    invoiceId: item.invoice.id,
    invoiceCode: item.invoice.code,
    amount: String(item.invoice.amount),
    dueDate: item.invoice.dueDate?.toISOString() ?? null,
    coverageStartMonth: item.invoice.coverageStartMonth,
    productId: item.productId,
    productName: resolved.productName,
    language: resolved.language,
    wave: item.wave,
    whatsappGroupChatId: item.groupChatId,
    messageText,
    asOf: asOf.toISOString(),
    asOfYerevan: asOfKey,
    companyName: item.invoice.company?.name ?? null,
  };
}

function isOverdueNotificationsEnabled(invoice: OverdueCandidate): boolean {
  if (!invoice.notificationsEnabled) return false;
  if (invoice.subscription != null) return invoice.subscription.notificationsEnabled;
  if (invoice.clientServiceRecord != null) return invoice.clientServiceRecord.notificationsEnabled;
  return false;
}
