import type { PrismaClient } from '@nbos/database';

/**
 * Best-effort dual-write: when a legacy channel/DM message is created and a unified
 * conversation with the same id exists (backfill reused ids), mirror the message.
 * Never throws — live legacy path stays authoritative until full cutover.
 */
export async function dualWriteLegacyMessageToUnified(
  prisma: InstanceType<typeof PrismaClient>,
  opts: {
    conversationId: string;
    messageId: string;
    senderId: string;
    senderNameSnapshot: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    fileAssetIds: string[];
  },
): Promise<void> {
  try {
    const conversation = await prisma.messengerConversation.findUnique({
      where: { id: opts.conversationId },
      select: { id: true },
    });
    if (!conversation) return;

    await prisma.messengerMessage.upsert({
      where: { id: opts.messageId },
      create: {
        id: opts.messageId,
        conversationId: opts.conversationId,
        senderId: opts.senderId,
        senderNameSnapshot: opts.senderNameSnapshot,
        content: opts.content,
        messageType: 'TEXT',
        createdAt: opts.createdAt,
        editedAt: opts.editedAt,
        attachments:
          opts.fileAssetIds.length > 0
            ? {
                createMany: {
                  data: opts.fileAssetIds.map((fileAssetId) => ({
                    fileAssetId,
                    attachedById: opts.senderId,
                  })),
                  skipDuplicates: true,
                },
              }
            : undefined,
      },
      update: {},
    });
    await prisma.messengerConversation.update({
      where: { id: opts.conversationId },
      data: { lastMessageAt: opts.createdAt },
    });
  } catch {
    // Dual-write must not break legacy send.
  }
}
