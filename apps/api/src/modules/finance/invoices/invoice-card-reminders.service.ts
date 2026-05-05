import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

const INVOICE_REMINDER_STATUSES = ['THIS_MONTH', 'WAITING', 'DELAYED'] as const;
const OFFICIAL_REQUEST_STATUSES = ['THIS_MONTH', 'CREATE_INVOICE', 'WAITING', 'DELAYED'] as const;
const INVOICE_REMINDER_RULE_RESOLVER = 'FINANCE_TEAM';
const INVOICE_REMINDER_SOURCE_MODULE = 'finance';

export const INVOICE_CARD_REMINDER_TYPES = {
  OFFICIAL_REQUEST_DUE: 'finance.invoice.official_request_due',
  PAYMENT_REMINDER_DUE: 'finance.invoice.payment_reminder_due',
} as const;

type InvoiceCardReminderType =
  (typeof INVOICE_CARD_REMINDER_TYPES)[keyof typeof INVOICE_CARD_REMINDER_TYPES];

interface InvoiceReminderRunParams {
  asOf?: Date;
}

interface InvoiceReminderCandidate {
  id: string;
  code: string;
  amount: unknown;
  dueDate: Date | null;
  taxStatus: string;
  status: string;
  govInvoiceId: string | null;
  company: { name: string } | null;
  clientServiceRecord: { notificationsEnabled: boolean } | null;
}

interface ReminderJobSeed {
  type: InvoiceCardReminderType;
  invoice: InvoiceReminderCandidate;
}

@Injectable()
export class InvoiceCardRemindersService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async runDueInvoiceCardReminders(params: InvoiceReminderRunParams = {}) {
    const asOf = startOfDay(params.asOf ?? new Date());
    const candidates = await this.findDueCandidates(asOf);
    const seeds = candidates.flatMap((invoice) => buildReminderSeeds(invoice));
    const created = [];
    let skippedExisting = 0;

    for (const seed of seeds) {
      const job = await this.createReminderJob(seed, asOf);
      if (job.created) created.push(job);
      if (!job.created) skippedExisting += 1;
    }

    return {
      asOf: asOf.toISOString(),
      eligibleCount: candidates.length,
      created,
      skippedExisting,
    };
  }

  private findDueCandidates(asOf: Date) {
    return this.prisma.invoice.findMany({
      where: {
        status: { in: [...OFFICIAL_REQUEST_STATUSES] },
        dueDate: { lte: asOf },
        OR: [
          { clientServiceRecordId: null },
          { clientServiceRecord: { is: { notificationsEnabled: true } } },
        ],
      },
      select: {
        id: true,
        code: true,
        amount: true,
        dueDate: true,
        taxStatus: true,
        status: true,
        govInvoiceId: true,
        company: { select: { name: true } },
        clientServiceRecord: { select: { notificationsEnabled: true } },
      },
    });
  }

  private async createReminderJob(seed: ReminderJobSeed, asOf: Date) {
    const dedupeKey = buildReminderDedupeKey(seed, asOf);
    const existing = await this.prisma.notificationJob.findUnique({ where: { dedupeKey } });
    if (existing) return { created: false, type: seed.type, invoiceId: seed.invoice.id };

    const rule = await this.prisma.notificationRule.upsert({
      where: { code: seed.type },
      update: { enabled: true, priority: 'high' },
      create: {
        code: seed.type,
        eventType: seed.type,
        recipientResolver: INVOICE_REMINDER_RULE_RESOLVER,
        priority: 'high',
      },
    });
    const event = await this.prisma.notificationEvent.upsert({
      where: { idempotencyKey: buildReminderIdempotencyKey(seed, asOf) },
      update: {},
      create: {
        eventType: seed.type,
        sourceModule: INVOICE_REMINDER_SOURCE_MODULE,
        sourceEntityType: 'Invoice',
        sourceEntityId: seed.invoice.id,
        payload: buildReminderPayload(seed.invoice, asOf),
        idempotencyKey: buildReminderIdempotencyKey(seed, asOf),
      },
    });

    await this.prisma.notificationJob.create({
      data: {
        eventId: event.id,
        ruleId: rule.id,
        status: 'PENDING',
        scheduledFor: asOf,
        dedupeKey,
      },
    });

    return { created: true, type: seed.type, invoiceId: seed.invoice.id };
  }
}

function buildReminderSeeds(invoice: InvoiceReminderCandidate): ReminderJobSeed[] {
  if (invoice.status === 'ON_HOLD') return [];
  if (invoice.taxStatus === 'TAX' && !invoice.govInvoiceId) {
    return [{ type: INVOICE_CARD_REMINDER_TYPES.OFFICIAL_REQUEST_DUE, invoice }];
  }
  if (isPaymentReminderStatus(invoice.status)) {
    return [{ type: INVOICE_CARD_REMINDER_TYPES.PAYMENT_REMINDER_DUE, invoice }];
  }
  return [];
}

function isPaymentReminderStatus(status: string) {
  return INVOICE_REMINDER_STATUSES.includes(status as (typeof INVOICE_REMINDER_STATUSES)[number]);
}

function buildReminderPayload(invoice: InvoiceReminderCandidate, asOf: Date): InputJsonValue {
  return {
    invoiceCode: invoice.code,
    amount: String(invoice.amount),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    companyName: invoice.company?.name ?? null,
    asOf: asOf.toISOString(),
  };
}

function buildReminderDedupeKey(seed: ReminderJobSeed, asOf: Date) {
  return `invoice_card:${seed.type}:${seed.invoice.id}:${dayKey(asOf)}`;
}

function buildReminderIdempotencyKey(seed: ReminderJobSeed, asOf: Date) {
  return `invoice-card-reminder:${seed.type}:${seed.invoice.id}:${dayKey(asOf)}`;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
