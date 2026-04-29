import type { PrismaClient } from '@nbos/database';

/**
 * Moves a stub-failed outbound message back to DRAFT so the user can edit and re-queue.
 * @returns whether a row was updated
 */
export async function applyFailedOutboundResetToDraft(
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
    data: { deliveryStatus: 'DRAFT' },
  });
  return result.count > 0;
}
