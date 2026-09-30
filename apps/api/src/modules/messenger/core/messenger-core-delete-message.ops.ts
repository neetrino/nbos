import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type OwnCoreMessageDeletePlan = {
  conversationId: string;
  deletedIds: string[];
};

export async function planOwnCoreMessageDelete(
  prisma: PrismaLike,
  employeeId: string,
  messageIds: string[],
): Promise<OwnCoreMessageDeletePlan> {
  const uniqueIds = [...new Set(messageIds)];
  const rows = await prisma.messengerMessage.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: { id: true, senderId: true, conversationId: true },
  });
  if (rows.length === 0) throw new NotFoundException('Message not found');
  const own = rows.filter((row) => row.senderId === employeeId);
  if (own.length === 0) {
    throw new ForbiddenException('You can delete only your own messages.');
  }
  const conversationId = own[0]?.conversationId;
  if (!conversationId || own.some((row) => row.conversationId !== conversationId)) {
    throw new ForbiddenException('Delete is limited to one conversation.');
  }
  return { conversationId, deletedIds: own.map((row) => row.id) };
}

export async function applyOwnCoreMessageSoftDelete(
  prisma: PrismaLike,
  employeeId: string,
  deletedIds: string[],
): Promise<void> {
  await prisma.messengerMessage.updateMany({
    where: { id: { in: deletedIds }, senderId: employeeId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
