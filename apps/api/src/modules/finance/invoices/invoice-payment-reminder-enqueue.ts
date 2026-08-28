import type { PrismaClient } from '@nbos/database';
import type { WhatsAppGatewayClient } from '../../integrations/whatsapp-gateway/whatsapp-gateway.client';
import type { WhatsAppGatewayConnectionService } from '../../integrations/whatsapp-gateway/whatsapp-gateway-connection.service';
import type { PaymentReminderCopy } from './invoice-payment-reminder-copy';
import { createInvoiceReminderNotificationJob } from './invoice-reminder-job-create';
import { tryDeliverPaymentReminderWhatsApp } from './invoice-payment-reminder-whatsapp';
import type { InputJsonValue } from '@nbos/database';

export async function enqueueAndSendPaymentReminder(params: {
  prisma: InstanceType<typeof PrismaClient>;
  connection?: WhatsAppGatewayConnectionService;
  client?: WhatsAppGatewayClient;
  type: string;
  invoiceId: string;
  invoiceCode: string;
  amount: unknown;
  dueDate: Date;
  copy: PaymentReminderCopy;
  offsetDays: number;
  asOf: Date;
  asOfKey: string;
  companyName: string | null;
  productId: string;
  groupChatId: string;
  dedupeKey: string;
  idempotencyKey: string;
  messageText: string;
}): Promise<{ jobId: string }> {
  const payload: InputJsonValue = {
    invoiceId: params.invoiceId,
    invoiceCode: params.invoiceCode,
    code: params.invoiceCode,
    amount: String(params.amount),
    dueDate: params.dueDate.toISOString(),
    coverageStartMonth: params.copy.coverageStartMonth,
    productId: params.productId,
    productName: params.copy.displayName,
    language: params.copy.language,
    kind: params.copy.kind,
    offsetDays: params.offsetDays,
    whatsappGroupChatId: params.groupChatId,
    messageText: params.messageText,
    asOf: params.asOf.toISOString(),
    asOfYerevan: params.asOfKey,
    companyName: params.companyName,
  };
  const job = await createInvoiceReminderNotificationJob(params.prisma, {
    type: params.type,
    invoiceId: params.invoiceId,
    dedupeKey: params.dedupeKey,
    idempotencyKey: params.idempotencyKey,
    scheduledFor: params.asOf,
    payload,
  });
  await tryDeliverPaymentReminderWhatsApp({
    prisma: params.prisma,
    connection: params.connection,
    client: params.client,
    jobId: job.jobId,
    chatId: params.groupChatId,
    text: params.messageText,
    idempotencyKey: params.dedupeKey,
  });
  return job;
}
