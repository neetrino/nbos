import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import type { WhatsAppOutboundKind } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';

const logger = new Logger('InvoicePaymentReminderWhatsApp');

/** Best-effort enqueue onto the paced outbound WhatsApp queue; never throws. */
export async function tryDeliverPaymentReminderWhatsApp(params: {
  prisma: InstanceType<typeof PrismaClient>;
  outbound?: WhatsAppOutboundQueueService;
  jobId: string;
  chatId: string;
  text: string;
  idempotencyKey: string;
  kind?: WhatsAppOutboundKind;
}): Promise<void> {
  if (!params.outbound) return;
  const kind = params.kind ?? 'payment_reminder';
  try {
    await params.outbound.enqueue(
      {
        kind,
        chatId: params.chatId,
        text: params.text,
        idempotencyKey: params.idempotencyKey,
        notificationJobId: params.jobId,
      },
      false,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`WhatsApp payment reminder enqueue failed (${params.idempotencyKey}): ${message}`);
    await params.prisma.notificationDelivery.create({
      data: {
        jobId: params.jobId,
        channel: 'WHATSAPP',
        recipient: params.chatId,
        status: 'FAILED',
        provider: 'whatsapp_gateway',
        errorMessage: message,
      },
    });
  }
}
