import type { PrismaClient } from '@nbos/database';
import { loadOrderedSourceMessages } from './messenger-core-source-load';
import { createCoreMessageReference } from './messenger-core-reference.ops';
import { requireTicketEntityAccess } from './messenger-core-ticket-access.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function attachTicketSourceReferences(
  prisma: PrismaLike,
  input: { sourceMessageIds: string[]; ticketId: string; createdById: string },
): Promise<{ referenceIds: string[]; sourceMessageIds: string[]; createdConversation: false }> {
  const ticket = await requireTicketEntityAccess(prisma, input.ticketId);
  const sources = await loadOrderedSourceMessages(prisma, input.sourceMessageIds);
  const referenceIds: string[] = [];
  for (const [index, source] of sources.entries()) {
    const created = await createCoreMessageReference(prisma, {
      sourceMessageId: source.id,
      targetEntityType: 'TICKET',
      targetEntityId: ticket.id,
      purpose: 'TICKET_SOURCE',
      sortOrder: index,
      createdById: input.createdById,
    });
    referenceIds.push(created.id);
  }
  return {
    referenceIds,
    sourceMessageIds: sources.map((row) => row.id),
    createdConversation: false,
  };
}
