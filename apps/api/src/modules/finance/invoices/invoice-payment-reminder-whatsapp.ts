import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { deliverFinanceClientReminder } from '../../messenger/core/messenger-finance-reminder.ops';

const logger = new Logger('InvoicePaymentReminderWhatsApp');

export async function findPaymentReminderCoreMessage(
  prisma: InstanceType<typeof PrismaClient>,
  idempotencyKey: string,
): Promise<{ id: string } | null> {
  return prisma.messengerMessage.findFirst({
    where: { idempotencyKey, deletedAt: null },
    select: { id: true },
  });
}

/**
 * Product payment reminders persist as Client Core SYSTEM outbound (FINANCE purpose)
 * then Slice 8 outbox. Official accountant send stays on accountingGroupChatId.
 * Persist errors propagate so callers do not record sent without a Core message.
 */
export async function tryDeliverPaymentReminderWhatsApp(params: {
  prisma: InstanceType<typeof PrismaClient>;
  outbound?: WhatsAppOutboundQueueService;
  productId: string;
  text: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const delivered = await deliverFinanceClientReminder(params.prisma, params.outbound, {
    productId: params.productId,
    text: params.text,
    idempotencyKey: params.idempotencyKey,
  });
  if (delivered) return true;
  logger.warn(`Finance reminder skipped (no FINANCE/WORK destination): ${params.idempotencyKey}`);
  return false;
}
