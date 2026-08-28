import { Logger } from '@nestjs/common';
import type { PrismaClient, SubscriptionReminderLanguage } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { tryDeliverPaymentReminderWhatsApp } from './invoice-payment-reminder-whatsapp';
import { isOfficialRequestBlockingTaxReminders } from './invoice-official-request';
import { isYerevanPaymentWindowOpen, paymentWindowDueDateBounds } from './invoice-payment-window';
import { resolveInvoiceProductWhatsAppGroup } from './invoice-product-whatsapp-resolve';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import {
  renderPaymentReminderMessage,
  resolvePaymentReminderRenderInput,
} from './invoice-payment-reminder-render';
import { paymentReminderSelect } from './invoice-card-reminder-selects';
import {
  buildPaymentWindowReminderDedupeKey,
  buildPaymentWindowReminderIdempotencyKey,
  SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES,
} from './subscription-payment-reminder.constants';

const logger = new Logger('InvoicePaymentWindowReminders');

const OPEN_MONEY_STATUSES = ['NEW', 'AWAITING_PAYMENT'] as const;

interface PaymentWindowCandidate {
  id: string;
  code: string;
  amount: unknown;
  dueDate: Date | null;
  createdAt: Date;
  coverageStartMonth: string | null;
  taxStatus: string;
  moneyStatus: string;
  officialInvoiceRequestSent: boolean;
  officialInvoiceSentAt: Date | null;
  notificationsEnabled: boolean;
  paymentReminderCycle: number;
  company: { name: string } | null;
  subscription: {
    productId: string;
    billingDay: number;
    notificationsEnabled: boolean;
    reminderLanguage: SubscriptionReminderLanguage;
    product: { id: string; name: string };
  } | null;
}

export interface PaymentWindowReminderCreated {
  created: true;
  type: string;
  invoiceId: string;
}

export async function runSubscriptionPaymentWindowReminders(args: {
  prisma: InstanceType<typeof PrismaClient>;
  outbound?: WhatsAppOutboundQueueService;
  asOf: Date;
  asOfKey: string;
}): Promise<{
  eligibleCount: number;
  created: PaymentWindowReminderCreated[];
  skippedExisting: number;
  skippedNoWhatsApp: number;
}> {
  const candidates = await findPaymentWindowCandidates(args.prisma, args.asOf);
  const created: PaymentWindowReminderCreated[] = [];
  let skippedExisting = 0;
  let skippedNoWhatsApp = 0;
  for (const invoice of candidates) {
    if (!isPaymentWindowEligible(invoice, args.asOf)) continue;
    const result = await createPaymentWindowJob(args, invoice);
    if (result.created) created.push(result);
    else if (result.reason === 'existing') skippedExisting += 1;
    else if (result.reason === 'no_whatsapp') skippedNoWhatsApp += 1;
  }
  return { eligibleCount: candidates.length, created, skippedExisting, skippedNoWhatsApp };
}

export async function tryEnqueueSubscriptionPaymentWindowForInvoice(args: {
  prisma: InstanceType<typeof PrismaClient>;
  outbound?: WhatsAppOutboundQueueService;
  invoiceId: string;
  asOf: Date;
  asOfKey: string;
}): Promise<void> {
  const invoice = await args.prisma.invoice.findUnique({
    where: { id: args.invoiceId },
    select: paymentReminderSelect,
  });
  if (invoice == null || !isPaymentWindowEligible(invoice, args.asOf)) return;
  await createPaymentWindowJob(args, invoice);
}

function findPaymentWindowCandidates(prisma: InstanceType<typeof PrismaClient>, asOf: Date) {
  const window = paymentWindowDueDateBounds(asOf);
  return prisma.invoice.findMany({
    where: {
      subscriptionId: { not: null },
      subscription: { is: { notificationsEnabled: true } },
      moneyStatus: { in: [...OPEN_MONEY_STATUSES] },
      dueDate: { gte: window.gte },
      notificationsEnabled: true,
    },
    select: paymentReminderSelect,
  });
}

function isPaymentWindowEligible(invoice: PaymentWindowCandidate, asOf: Date): boolean {
  if (invoice.dueDate == null) return false;
  if (invoice.subscription == null) return false;
  if (invoice.moneyStatus === 'ON_HOLD') return false;
  if (!invoice.notificationsEnabled || !invoice.subscription.notificationsEnabled) return false;
  if (isOfficialRequestBlockingTaxReminders(invoice)) return false;
  const issuedOn =
    invoice.taxStatus === 'TAX' && invoice.officialInvoiceSentAt != null
      ? invoice.officialInvoiceSentAt
      : invoice.createdAt;
  return isYerevanPaymentWindowOpen(asOf, {
    issuedOn,
    dueDate: invoice.dueDate,
    coverageStartMonth: invoice.coverageStartMonth,
    billingDay: invoice.subscription.billingDay,
  });
}

async function createPaymentWindowJob(
  args: {
    prisma: InstanceType<typeof PrismaClient>;
    outbound?: WhatsAppOutboundQueueService;
    asOf: Date;
    asOfKey: string;
  },
  invoice: PaymentWindowCandidate,
): Promise<
  | PaymentWindowReminderCreated
  | { created: false; type: string; invoiceId: string; reason: 'existing' | 'no_whatsapp' }
> {
  const type = SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.WINDOW;
  const dueDate = invoice.dueDate;
  if (dueDate == null) {
    return { created: false, type, invoiceId: invoice.id, reason: 'existing' };
  }
  const resolved = resolvePaymentReminderRenderInput({
    amount: invoice.amount,
    taxStatus: invoice.taxStatus,
    coverageStartMonth: invoice.coverageStartMonth,
    dueDate,
    subscription: invoice.subscription,
    clientServiceRecord: null,
  });
  if (resolved == null) {
    return { created: false, type, invoiceId: invoice.id, reason: 'existing' };
  }
  const cycle = invoice.paymentReminderCycle;
  const dedupeKey = buildPaymentWindowReminderDedupeKey(invoice.id, cycle);
  const existing = await args.prisma.notificationJob.findUnique({ where: { dedupeKey } });
  if (existing) {
    return { created: false, type, invoiceId: invoice.id, reason: 'existing' };
  }
  return enqueuePaymentWindowJob(args, invoice, dueDate, resolved, dedupeKey, cycle);
}

async function enqueuePaymentWindowJob(
  args: {
    prisma: InstanceType<typeof PrismaClient>;
    outbound?: WhatsAppOutboundQueueService;
    asOf: Date;
    asOfKey: string;
  },
  invoice: PaymentWindowCandidate,
  dueDate: Date,
  resolved: NonNullable<ReturnType<typeof resolvePaymentReminderRenderInput>>,
  dedupeKey: string,
  cycle: number,
): Promise<
  | PaymentWindowReminderCreated
  | { created: false; type: string; invoiceId: string; reason: 'no_whatsapp' }
> {
  const type = SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.WINDOW;
  const productWhatsApp = await resolveInvoiceProductWhatsAppGroup(args.prisma, invoice.id);
  if (!productWhatsApp?.groupChatId) {
    logger.warn(`Payment window reminder skipped (no Product WhatsApp group): ${invoice.code}`);
    return { created: false, type, invoiceId: invoice.id, reason: 'no_whatsapp' };
  }
  const messageText = renderPaymentReminderMessage(resolved);
  const job = await createInvoiceReminderNotificationJob(args.prisma, {
    type,
    invoiceId: invoice.id,
    dedupeKey,
    idempotencyKey: buildPaymentWindowReminderIdempotencyKey(invoice.id, cycle),
    scheduledFor: args.asOf,
    payload: paymentWindowJobPayload(
      args,
      invoice,
      dueDate,
      resolved,
      productWhatsApp,
      messageText,
    ),
  });
  await tryDeliverPaymentReminderWhatsApp({
    prisma: args.prisma,
    outbound: args.outbound,
    jobId: job.jobId,
    chatId: productWhatsApp.groupChatId,
    text: messageText,
    idempotencyKey: dedupeKey,
  });
  return { created: true, type, invoiceId: invoice.id };
}

function paymentWindowJobPayload(
  args: { asOf: Date; asOfKey: string },
  invoice: PaymentWindowCandidate,
  dueDate: Date,
  resolved: NonNullable<ReturnType<typeof resolvePaymentReminderRenderInput>>,
  productWhatsApp: { productId: string; groupChatId: string },
  messageText: string,
) {
  return {
    invoiceId: invoice.id,
    invoiceCode: invoice.code,
    amount: String(invoice.amount),
    dueDate: dueDate.toISOString(),
    coverageStartMonth: invoice.coverageStartMonth,
    productId: productWhatsApp.productId,
    productName: resolved.productName,
    language: resolved.language,
    whatsappGroupChatId: productWhatsApp.groupChatId,
    messageText,
    asOf: args.asOf.toISOString(),
    asOfYerevan: args.asOfKey,
    companyName: invoice.company?.name ?? null,
  };
}
