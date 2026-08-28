import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient, type SubscriptionReminderLanguage } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { WhatsAppGatewayClient } from '../../integrations/whatsapp-gateway/whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from '../../integrations/whatsapp-gateway/whatsapp-gateway-connection.service';
import { isOfficialRequestBlockingTaxReminders } from './invoice-official-request';
import { enqueueAndSendPaymentReminder } from './invoice-payment-reminder-enqueue';
import {
  renderResolvedPaymentReminderMessage,
  resolvePaymentReminderCopy,
} from './invoice-payment-reminder-copy';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import {
  buildSubscriptionPaymentReminderDedupeKey,
  buildSubscriptionPaymentReminderIdempotencyKey,
  paymentReminderEventTypeForOffset,
  SUBSCRIPTION_PAYMENT_REMINDER_DAYS_BEFORE_DUE,
  type SubscriptionPaymentReminderOffsetDays,
} from './subscription-payment-reminder.constants';
import {
  isYerevanDueOffsetDay,
  yerevanCalendarDateKey,
  yerevanDueDateWindowForOffsets,
} from './yerevan-calendar-date';
import { officialRequestSelect, paymentReminderSelect } from './invoice-card-reminder-selects';

const REMINDER_ELIGIBLE_MONEY_STATUSES = ['NEW', 'AWAITING_PAYMENT', 'OVERDUE'] as const;

export const INVOICE_CARD_REMINDER_TYPES = {
  OFFICIAL_REQUEST_DUE: 'finance.invoice.official_request_due',
} as const;

interface InvoiceReminderRunParams {
  asOf?: Date;
}

interface OfficialRequestCandidate {
  id: string;
  code: string;
  amount: unknown;
  dueDate: Date | null;
  taxStatus: string;
  moneyStatus: string;
  officialInvoiceRequestSent: boolean;
  notificationsEnabled: boolean;
  company: { name: string } | null;
  clientServiceRecord: { notificationsEnabled: boolean } | null;
}

interface PaymentReminderCandidate {
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
    name: string;
    productId: string | null;
    reminderLanguage: SubscriptionReminderLanguage;
  } | null;
  subscription: {
    productId: string;
    notificationsEnabled: boolean;
    reminderLanguage: SubscriptionReminderLanguage;
    product: { id: string; name: string };
  } | null;
}

@Injectable()
export class InvoiceCardRemindersService {
  private readonly logger = new Logger(InvoiceCardRemindersService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly whatsappConnection?: WhatsAppGatewayConnectionService,
    @Optional() private readonly whatsappClient?: WhatsAppGatewayClient,
  ) {}

  async runDueInvoiceCardReminders(params: InvoiceReminderRunParams = {}) {
    const asOf = params.asOf ?? new Date();
    const asOfKey = yerevanCalendarDateKey(asOf);
    const official = await this.runOfficialRequestDue(asOf, asOfKey);
    const payment = await this.runSubscriptionPaymentReminders(asOf, asOfKey);
    return {
      asOf: asOf.toISOString(),
      asOfYerevan: asOfKey,
      eligibleCount: official.eligibleCount + payment.eligibleCount,
      created: [...official.created, ...payment.created],
      skippedExisting: official.skippedExisting + payment.skippedExisting,
      skippedNoWhatsApp: payment.skippedNoWhatsApp,
    };
  }

  private async runOfficialRequestDue(asOf: Date, asOfKey: string) {
    const candidates = await this.findOfficialRequestCandidates(asOf);
    const created = [];
    let skippedExisting = 0;
    for (const invoice of candidates) {
      if (!isOfficialRequestBlockingTaxReminders(invoice)) continue;
      if (invoice.moneyStatus === 'ON_HOLD') continue;
      const result = await this.createOfficialRequestJob(invoice, asOf, asOfKey);
      if (result.created) created.push(result);
      else skippedExisting += 1;
    }
    return { eligibleCount: candidates.length, created, skippedExisting };
  }

  private async runSubscriptionPaymentReminders(asOf: Date, asOfKey: string) {
    const candidates = await this.findPaymentReminderCandidates(asOf);
    const created = [];
    let skippedExisting = 0;
    let skippedNoWhatsApp = 0;
    for (const invoice of candidates) {
      const dueDate = invoice.dueDate;
      if (dueDate == null) continue;
      if (!isPaymentReminderEligible(invoice)) continue;
      for (const offsetDays of SUBSCRIPTION_PAYMENT_REMINDER_DAYS_BEFORE_DUE) {
        if (!isYerevanDueOffsetDay(asOf, dueDate, offsetDays)) continue;
        const result = await this.createPaymentReminderJob(invoice, offsetDays, asOf, asOfKey);
        if (result.created) created.push(result);
        else if (result.reason === 'existing') skippedExisting += 1;
        else if (result.reason === 'no_whatsapp') skippedNoWhatsApp += 1;
      }
    }
    return { eligibleCount: candidates.length, created, skippedExisting, skippedNoWhatsApp };
  }

  private findOfficialRequestCandidates(asOf: Date) {
    const asOfKey = yerevanCalendarDateKey(asOf);
    const endOfToday = new Date(`${asOfKey}T23:59:59.999+04:00`);
    return this.prisma.invoice.findMany({
      where: {
        moneyStatus: { in: [...REMINDER_ELIGIBLE_MONEY_STATUSES] },
        dueDate: { lte: endOfToday },
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
        notificationsEnabled: true,
        OR: [
          { clientServiceRecordId: null },
          { clientServiceRecord: { is: { notificationsEnabled: true } } },
        ],
      },
      select: officialRequestSelect,
    });
  }

  private findPaymentReminderCandidates(asOf: Date) {
    const maxOffset = Math.max(...SUBSCRIPTION_PAYMENT_REMINDER_DAYS_BEFORE_DUE);
    const window = yerevanDueDateWindowForOffsets(asOf, maxOffset);
    return this.prisma.invoice.findMany({
      where: {
        moneyStatus: { in: [...REMINDER_ELIGIBLE_MONEY_STATUSES] },
        dueDate: { gte: window.gte, lte: window.lte },
        notificationsEnabled: true,
        OR: [
          {
            subscriptionId: { not: null },
            subscription: { is: { notificationsEnabled: true } },
            OR: [
              { clientServiceRecordId: null },
              { clientServiceRecord: { is: { notificationsEnabled: true } } },
            ],
          },
          {
            subscriptionId: null,
            clientServiceRecordId: { not: null },
            clientServiceRecord: { is: { notificationsEnabled: true } },
          },
        ],
      },
      select: paymentReminderSelect,
    });
  }

  private async createOfficialRequestJob(
    invoice: OfficialRequestCandidate,
    asOf: Date,
    asOfKey: string,
  ) {
    const type = INVOICE_CARD_REMINDER_TYPES.OFFICIAL_REQUEST_DUE;
    const dedupeKey = `invoice_card:${type}:${invoice.id}:${asOfKey}`;
    const existing = await this.prisma.notificationJob.findUnique({ where: { dedupeKey } });
    if (existing) return { created: false as const, type, invoiceId: invoice.id };

    const productWhatsApp = await resolveInvoiceProductWhatsAppGroup(this.prisma, invoice.id);
    await createInvoiceReminderNotificationJob(this.prisma, {
      type,
      invoiceId: invoice.id,
      dedupeKey,
      idempotencyKey: `invoice-card-reminder:${type}:${invoice.id}:${asOfKey}`,
      scheduledFor: asOf,
      payload: {
        invoiceCode: invoice.code,
        amount: String(invoice.amount),
        dueDate: invoice.dueDate?.toISOString() ?? null,
        companyName: invoice.company?.name ?? null,
        asOf: asOf.toISOString(),
        asOfYerevan: asOfKey,
        productId: productWhatsApp?.productId ?? null,
        whatsappGroupChatId: productWhatsApp?.groupChatId ?? null,
      },
    });
    return { created: true as const, type, invoiceId: invoice.id };
  }

  private async createPaymentReminderJob(
    invoice: PaymentReminderCandidate,
    offsetDays: SubscriptionPaymentReminderOffsetDays,
    asOf: Date,
    asOfKey: string,
  ) {
    const dueDate = invoice.dueDate;
    const copy = resolvePaymentReminderCopy(invoice);
    const type = paymentReminderEventTypeForOffset(offsetDays);
    if (dueDate == null || copy == null) {
      return { created: false as const, type, invoiceId: invoice.id, reason: 'existing' as const };
    }

    const dedupeKey = buildSubscriptionPaymentReminderDedupeKey(invoice.id, offsetDays);
    const existing = await this.prisma.notificationJob.findUnique({ where: { dedupeKey } });
    if (existing) {
      return { created: false as const, type, invoiceId: invoice.id, reason: 'existing' as const };
    }

    const productWhatsApp = await resolveInvoiceProductWhatsAppGroup(this.prisma, invoice.id);
    if (!productWhatsApp?.groupChatId) {
      this.logger.warn(
        `Payment reminder skipped (no Product WhatsApp group): invoice=${invoice.code} offset=d${offsetDays}`,
      );
      return { created: false as const, type, invoiceId: invoice.id, reason: 'no_whatsapp' as const };
    }

    const messageText = renderResolvedPaymentReminderMessage(copy, offsetDays);
    await enqueueAndSendPaymentReminder({
      prisma: this.prisma,
      connection: this.whatsappConnection,
      client: this.whatsappClient,
      type,
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      amount: invoice.amount,
      dueDate,
      copy,
      offsetDays,
      asOf,
      asOfKey,
      companyName: invoice.company?.name ?? null,
      productId: productWhatsApp.productId,
      groupChatId: productWhatsApp.groupChatId,
      dedupeKey,
      idempotencyKey: buildSubscriptionPaymentReminderIdempotencyKey(invoice.id, offsetDays),
      messageText,
    });
    return { created: true as const, type, invoiceId: invoice.id };
  }
}

function isPaymentReminderEligible(invoice: PaymentReminderCandidate): boolean {
  if (invoice.moneyStatus === 'ON_HOLD') return false;
  if (!invoice.notificationsEnabled) return false;
  if (invoice.subscription) {
    if (!invoice.subscription.notificationsEnabled) return false;
  } else if (!invoice.clientServiceRecord) {
    return false;
  }
  if (invoice.clientServiceRecord && !invoice.clientServiceRecord.notificationsEnabled) {
    return false;
  }
  if (isOfficialRequestBlockingTaxReminders(invoice)) return false;
  return true;
}
