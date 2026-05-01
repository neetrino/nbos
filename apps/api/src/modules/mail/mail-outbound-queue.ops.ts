import type { PrismaClient } from '@nbos/database';

/**
 * Sets deliveryStatus to QUEUED for an outbound DRAFT in the given thread.
 * @returns whether a row was updated
 */
export async function queueOutboundDraftMessage(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; messageId: string },
): Promise<boolean> {
  const result = await prisma.emailMessage.updateMany({
    where: {
      id: params.messageId,
      threadId: params.threadId,
      direction: 'OUTBOUND',
      deliveryStatus: 'DRAFT',
    },
    data: { deliveryStatus: 'QUEUED' },
  });
  return result.count > 0;
}
