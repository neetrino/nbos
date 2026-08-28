import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { isOfficialRequestBlockingTaxReminders } from './invoice-official-request';
import { InvoiceOfficialWhatsAppService } from './invoice-official-whatsapp.service';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';
import { officialRequestSelect } from './invoice-card-reminder-selects';

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

@Injectable()
export class InvoiceCardRemindersService {
  private readonly logger = new Logger(InvoiceCardRemindersService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly officialWhatsApp?: InvoiceOfficialWhatsAppService,
  ) {}

  /**
   * Accountant official-request only. Client WhatsApp is the manual overdue
   * button (w1/w2), not a pre-due D-10 / D-2 cron.
   */
  async runDueInvoiceCardReminders(params: InvoiceReminderRunParams = {}) {
    const asOf = params.asOf ?? new Date();
    const asOfKey = yerevanCalendarDateKey(asOf);
    const official = await this.runOfficialRequestDue(asOf, asOfKey);
    return {
      asOf: asOf.toISOString(),
      asOfYerevan: asOfKey,
      eligibleCount: official.eligibleCount,
      created: official.created,
      skippedExisting: official.skippedExisting,
      skippedNoWhatsApp: 0,
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
    try {
      await this.officialWhatsApp?.enqueueDueSend(invoice.id, asOfKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Official request WhatsApp enqueue failed invoice=${invoice.code}: ${message}`,
      );
    }
    return { created: existing ? (false as const) : (true as const), type, invoiceId: invoice.id };
  }
}
