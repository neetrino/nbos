import { Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { runSubscriptionPaymentWindowReminders } from './invoice-card-payment-window-reminders';
import { isOfficialRequestBlockingTaxReminders } from './invoice-official-request';
import { InvoiceOfficialWhatsAppService } from './invoice-official-whatsapp.service';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';
import { officialRequestSelect } from './invoice-card-reminder-selects';
import { SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES } from './subscription-payment-reminder.constants';

export const INVOICE_CARD_REMINDER_TYPES = {
  OFFICIAL_REQUEST_DUE: 'finance.invoice.official_request_due',
  PAYMENT_WINDOW: SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.WINDOW,
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
  officialInvoiceRequestSent: boolean;
  company: { name: string } | null;
}

@Injectable()
export class InvoiceCardRemindersService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly officialWhatsApp?: InvoiceOfficialWhatsAppService,
    @Optional() private readonly outbound?: WhatsAppOutboundQueueService,
  ) {}

  /**
   * Tax official-request catch-up on Awaiting, plus subscription «pay within 5
   * days» on the pay/issue anchor. Overdue client waves stay manual.
   */
  async runDueInvoiceCardReminders(params: InvoiceReminderRunParams = {}) {
    const asOf = params.asOf ?? new Date();
    const asOfKey = yerevanCalendarDateKey(asOf);
    const official = await this.runOfficialRequestDue(asOf, asOfKey);
    const payment = await runSubscriptionPaymentWindowReminders({
      prisma: this.prisma,
      outbound: this.outbound,
      asOf,
      asOfKey,
    });
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
    const candidates = await this.findOfficialRequestCandidates();
    const created = [];
    let skippedExisting = 0;
    for (const invoice of candidates) {
      if (!isOfficialRequestBlockingTaxReminders(invoice)) continue;
      const result = await this.createOfficialRequestJob(invoice, asOf, asOfKey);
      if (result.created) created.push(result);
      else skippedExisting += 1;
    }
    return { eligibleCount: candidates.length, created, skippedExisting };
  }

  private findOfficialRequestCandidates() {
    return this.prisma.invoice.findMany({
      where: {
        moneyStatus: 'AWAITING_PAYMENT',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      },
      select: officialRequestSelect,
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
    if (!existing) {
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
    }
    await this.officialWhatsApp?.enqueueIfAwaitingEligible(invoice.id);
    return { created: existing ? (false as const) : (true as const), type, invoiceId: invoice.id };
  }
}
