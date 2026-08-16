import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { WhatsAppGatewayClient } from '../../integrations/whatsapp-gateway/whatsapp-gateway.client';
import type { WhatsAppGatewayConnectionService } from '../../integrations/whatsapp-gateway/whatsapp-gateway-connection.service';

const logger = new Logger('InvoicePaymentReminderWhatsApp');

/** Best-effort Product WhatsApp send + NotificationDelivery; never throws. */
export async function tryDeliverPaymentReminderWhatsApp(params: {
  prisma: InstanceType<typeof PrismaClient>;
  connection?: WhatsAppGatewayConnectionService;
  client?: WhatsAppGatewayClient;
  jobId: string;
  chatId: string;
  text: string;
  idempotencyKey: string;
}): Promise<void> {
  if (!params.connection || !params.client) return;
  try {
    const config = await params.connection.requireClientConfig();
    const result = await params.client.sendTextMessage(config, {
      chatId: params.chatId,
      text: params.text,
    });
    await params.prisma.notificationDelivery.create({
      data: {
        jobId: params.jobId,
        channel: 'WHATSAPP',
        recipient: params.chatId,
        status: 'DELIVERED',
        provider: 'whatsapp_gateway',
        providerMessageId: result.messageId ?? null,
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });
    await params.prisma.notificationJob.update({
      where: { id: params.jobId },
      data: { status: 'DELIVERED', processedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`WhatsApp payment reminder send failed (${params.idempotencyKey}): ${message}`);
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
