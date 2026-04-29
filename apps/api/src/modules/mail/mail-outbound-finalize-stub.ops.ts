import type { PrismaClient } from '@nbos/database';

/**
 * MVP stub: marks an outbound QUEUED message as FAILED (no mail provider / worker).
 */
export async function failQueuedOutboundStubNoProvider(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; messageId: string },
): Promise<boolean> {
  const result = await prisma.emailMessage.updateMany({
    where: {
      id: params.messageId,
      threadId: params.threadId,
      direction: 'OUTBOUND',
      deliveryStatus: 'QUEUED',
    },
    data: { deliveryStatus: 'FAILED' },
  });
  return result.count > 0;
}
