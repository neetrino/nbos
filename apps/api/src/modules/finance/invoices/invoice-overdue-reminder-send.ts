import { Logger } from '@nestjs/common';
import type { PrismaClient, SubscriptionReminderLanguage } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import {
  findPaymentReminderCoreMessage,
  tryDeliverPaymentReminderWhatsApp,
} from './invoice-payment-reminder-whatsapp';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import { resolveOverdueReminderRenderInput } from './invoice-overdue-reminder-render';
import { renderOverdueReminderMessage } from './invoice-overdue-reminder-templates';
import {
  buildOverdueReminderDedupeKey,
  buildOverdueReminderIdempotencyKey,
  overdueReminderEventTypeForWave,
  type OverdueReminderSkipReason,
  type OverdueReminderWave,
} from './invoice-overdue-reminder.constants';

const logger = new Logger('InvoiceOverdueReminderSend');

type PrismaLike = InstanceType<typeof PrismaClient>;

type OverdueSendInvoice = {
  id: string;
  code: string;
  amount: unknown;
  dueDate: Date | null;
  coverageStartMonth: string | null;
  taxStatus: string;
  company: { name: string } | null;
  clientServiceRecord: {
    notificationsEnabled: boolean;
    reminderLanguage: SubscriptionReminderLanguage;
    productId: string | null;
    name: string;
    product: { id: string; name: string } | null;
  } | null;
  subscription: {
    productId: string;
    notificationsEnabled: boolean;
    reminderLanguage: SubscriptionReminderLanguage;
    product: { id: string; name: string };
  } | null;
};

export type OverdueSendItem = {
  invoice: OverdueSendInvoice;
  wave: OverdueReminderWave;
  groupChatId: string;
  productId: string;
};

export async function sendOverdueReminderWave(
  prisma: PrismaLike,
  outbound: WhatsAppOutboundQueueService | undefined,
  item: OverdueSendItem,
  asOf: Date,
  asOfKey: string,
): Promise<{ kind: 'sent' } | { kind: 'skip'; reason: OverdueReminderSkipReason }> {
  const dedupeKey = buildOverdueReminderDedupeKey(item.invoice.id, item.wave);
  const existingJob = await prisma.notificationJob.findUnique({ where: { dedupeKey } });
  const existingCore = await findPaymentReminderCoreMessage(prisma, dedupeKey);
  if (existingCore) {
    await ensureOverdueJob(prisma, item, asOf, asOfKey, existingJob != null);
    return { kind: 'skip', reason: 'already_sent' };
  }
  const persisted = await persistOverdueCore(prisma, outbound, item, dedupeKey);
  if (persisted.kind === 'skip') return persisted;
  await ensureOverdueJob(prisma, item, asOf, asOfKey, existingJob != null, persisted.messageText);
  return { kind: 'sent' };
}

async function persistOverdueCore(
  prisma: PrismaLike,
  outbound: WhatsAppOutboundQueueService | undefined,
  item: OverdueSendItem,
  dedupeKey: string,
): Promise<
  { kind: 'ok'; messageText: string } | { kind: 'skip'; reason: OverdueReminderSkipReason }
> {
  const resolved = resolveOverdueRender(item);
  if (resolved == null) return { kind: 'skip', reason: 'no_product_link' };
  try {
    const delivered = await tryDeliverPaymentReminderWhatsApp({
      prisma,
      outbound,
      productId: item.productId,
      text: resolved.messageText,
      idempotencyKey: dedupeKey,
    });
    if (!delivered) return { kind: 'skip', reason: 'no_whatsapp' };
    return { kind: 'ok', messageText: resolved.messageText };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Overdue reminder Core persist failed: invoice=${item.invoice.code} ${message}`);
    return { kind: 'skip', reason: 'send_failed' };
  }
}

async function ensureOverdueJob(
  prisma: PrismaLike,
  item: OverdueSendItem,
  asOf: Date,
  asOfKey: string,
  jobExists: boolean,
  messageText?: string,
): Promise<void> {
  if (jobExists) return;
  const resolved = resolveOverdueRender(item);
  await createInvoiceReminderNotificationJob(prisma, {
    type: overdueReminderEventTypeForWave(item.wave),
    invoiceId: item.invoice.id,
    dedupeKey: buildOverdueReminderDedupeKey(item.invoice.id, item.wave),
    idempotencyKey: buildOverdueReminderIdempotencyKey(item.invoice.id, item.wave),
    scheduledFor: asOf,
    payload: overdueJobPayload(
      item,
      asOf,
      asOfKey,
      resolved?.productName ?? '',
      messageText ?? resolved?.messageText ?? '',
    ),
  });
}

function resolveOverdueRender(item: OverdueSendItem) {
  const resolved = resolveOverdueReminderRenderInput({
    amount: item.invoice.amount,
    taxStatus: item.invoice.taxStatus,
    coverageStartMonth: item.invoice.coverageStartMonth,
    dueDate: item.invoice.dueDate,
    wave: item.wave,
    subscription: item.invoice.subscription,
    clientServiceRecord: item.invoice.clientServiceRecord,
  });
  if (resolved == null) return null;
  return {
    productName: resolved.productName,
    messageText: renderOverdueReminderMessage(resolved.renderInput),
  };
}

function overdueJobPayload(
  item: OverdueSendItem,
  asOf: Date,
  asOfKey: string,
  productName: string,
  messageText: string,
) {
  return {
    invoiceId: item.invoice.id,
    invoiceCode: item.invoice.code,
    amount: String(item.invoice.amount),
    dueDate: item.invoice.dueDate?.toISOString() ?? null,
    coverageStartMonth: item.invoice.coverageStartMonth,
    productId: item.productId,
    productName,
    language:
      item.invoice.subscription?.reminderLanguage ??
      item.invoice.clientServiceRecord?.reminderLanguage ??
      'HY',
    wave: item.wave,
    whatsappGroupChatId: item.groupChatId,
    messageText,
    asOf: asOf.toISOString(),
    asOfYerevan: asOfKey,
    companyName: item.invoice.company?.name ?? null,
  };
}
