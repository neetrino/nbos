import type { PrismaClient } from '@nbos/database';

export type OutboundSendGate =
  | { action: 'exit' }
  | { action: 'send' }
  | { action: 'finalize_sent'; providerMessageId: string };

/**
 * Decides whether this worker may call the provider.
 * SENT/CANCELLED exit. QUEUED is claimed via SENDING. Existing SENDING without
 * provider id is a retry of the same job and may proceed.
 */
export async function gateOutboundSendAttempt(
  prisma: InstanceType<typeof PrismaClient>,
  messageId: string,
  mailAccountId: string,
): Promise<OutboundSendGate> {
  const message = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      mailAccountId: true,
      direction: true,
      deliveryStatus: true,
      providerMessageId: true,
    },
  });
  if (!message || message.mailAccountId !== mailAccountId || message.direction !== 'OUTBOUND') {
    return { action: 'exit' };
  }
  if (message.deliveryStatus === 'SENT' || message.deliveryStatus === 'CANCELLED') {
    return { action: 'exit' };
  }
  if (message.deliveryStatus === 'SENDING' && message.providerMessageId) {
    return { action: 'finalize_sent', providerMessageId: message.providerMessageId };
  }
  if (message.deliveryStatus === 'SENDING') {
    return { action: 'send' };
  }
  if (message.deliveryStatus !== 'QUEUED') {
    return { action: 'exit' };
  }
  const claimed = await prisma.emailMessage.updateMany({
    where: { id: messageId, deliveryStatus: 'QUEUED' },
    data: { deliveryStatus: 'SENDING' },
  });
  return claimed.count > 0 ? { action: 'send' } : { action: 'exit' };
}
