import type { PrismaClient } from '@nbos/database';
import { MESSENGER_CLIENT_ACTION_HOOKS } from './messenger-core-client-action-hooks';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type TicketSourceListItem = {
  referenceId: string;
  sourceMessageId: string;
  sourceConversationId: string;
  sortOrder: number;
  preview: string | null;
  canOpen: boolean;
};

export async function listTicketSourceReferences(
  prisma: PrismaLike,
  ticketId: string,
  canReadConversation: (conversationId: string) => Promise<boolean>,
): Promise<TicketSourceListItem[]> {
  const rows = await prisma.messengerMessageReference.findMany({
    where: {
      purpose: MESSENGER_CLIENT_ACTION_HOOKS.ticketSourcePurpose,
      entityType: 'TICKET',
      entityId: ticketId,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      sourceMessageId: true,
      sourceConversationId: true,
      sortOrder: true,
      sourceMessage: { select: { content: true, deletedAt: true } },
    },
  });
  const items: TicketSourceListItem[] = [];
  for (const row of rows) {
    const canOpen = await canReadConversation(row.sourceConversationId);
    items.push({
      referenceId: row.id,
      sourceMessageId: row.sourceMessageId,
      sourceConversationId: row.sourceConversationId,
      sortOrder: row.sortOrder,
      preview: canOpen && !row.sourceMessage.deletedAt ? row.sourceMessage.content : null,
      canOpen,
    });
  }
  return items;
}
