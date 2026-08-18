import type { PrismaClient } from '@nbos/database';

/**
 * Moves a FAILED outbound message back to QUEUED for another send attempt.
 * @returns whether a row was updated
 */
export async function queueFailedOutboundForRetry(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; messageId: string },
): Promise<boolean> {
  const result = await prisma.emailMessage.updateMany({
    where: {
      id: params.messageId,
      threadId: params.threadId,
      direction: 'OUTBOUND',
      deliveryStatus: 'FAILED',
    },
    data: { deliveryStatus: 'QUEUED', sentAt: null, providerMessageId: null },
  });
  return result.count > 0;
}
