import type { PrismaClient } from '@nbos/database';

/**
 * Cancels outbound delivery for a draft or queued message (no provider interaction).
 * @returns whether a row was updated
 */
export async function cancelOutboundDraftOrQueued(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; messageId: string },
): Promise<boolean> {
  const result = await prisma.emailMessage.updateMany({
    where: {
      id: params.messageId,
      threadId: params.threadId,
      direction: 'OUTBOUND',
      deliveryStatus: { in: ['DRAFT', 'QUEUED'] },
    },
    data: { deliveryStatus: 'CANCELLED' },
  });
  return result.count > 0;
}
