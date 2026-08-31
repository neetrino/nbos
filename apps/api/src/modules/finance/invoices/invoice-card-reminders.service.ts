import { Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { runSubscriptionPaymentWindowReminders } from './invoice-card-payment-window-reminders';
import { notifyOfficialAfterInvoiceWrite } from './invoice-card-persist';
import { InvoiceOfficialWhatsAppService } from './invoice-official-whatsapp.service';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';
import { SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES } from './subscription-payment-reminder.constants';

export const INVOICE_CARD_REMINDER_TYPES = {
  OFFICIAL_REQUEST_DUE: 'finance.invoice.official_request_due',
  PAYMENT_WINDOW: SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.WINDOW,
} as const;

interface InvoiceReminderRunParams {
  asOf?: Date;
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
    const official = await this.runOfficialRequestDue();
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

  private async runOfficialRequestDue() {
    const candidates = await this.findOfficialRequestCandidates();
    const type = INVOICE_CARD_REMINDER_TYPES.OFFICIAL_REQUEST_DUE;
    const created = [];
    for (const invoice of candidates) {
      await notifyOfficialAfterInvoiceWrite(this.officialWhatsApp, invoice);
      created.push({ created: true as const, type, invoiceId: invoice.id });
    }
    return { eligibleCount: candidates.length, created, skippedExisting: 0 };
  }

  private findOfficialRequestCandidates() {
    return this.prisma.invoice.findMany({
      where: {
        moneyStatus: 'AWAITING_PAYMENT',
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      },
      select: { id: true },
    });
  }
}
