import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { MessengerCoreLinkInput } from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function addCoreConversationLink(
  prisma: PrismaLike,
  conversationId: string,
  link: MessengerCoreLinkInput,
): Promise<{ id: string }> {
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { zone: true },
  });
  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }
  const created = await prisma.messengerConversationLink.create({
    data: {
      conversationId,
      entityType: link.entityType,
      entityId: link.entityId,
      relationType: link.relationType,
    },
    select: { id: true },
  });
  return created;
}

export async function listCoreConversationLinks(
  prisma: PrismaLike,
  conversationId: string,
): Promise<Array<MessengerCoreLinkInput & { id: string }>> {
  const rows = await prisma.messengerConversationLink.findMany({
    where: { conversationId },
  });
  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    relationType: row.relationType,
  }));
}
