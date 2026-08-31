import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { sortCoreMessagesByCreatedAtId } from './messenger-core-message-order';
import { MESSENGER_CORE_FORWARD_SOURCE_MAX_COUNT } from './messenger-core.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function loadOrderedSourceMessages(
  prisma: PrismaLike,
  sourceMessageIds: string[],
): Promise<Array<{ id: string; conversationId: string; content: string; createdAt: Date }>> {
  const uniqueIds = [...new Set(sourceMessageIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new BadRequestException('Select at least one source message');
  }
  if (uniqueIds.length > MESSENGER_CORE_FORWARD_SOURCE_MAX_COUNT) {
    throw new BadRequestException('Too many source messages');
  }
  const rows = await prisma.messengerMessage.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: { id: true, conversationId: true, content: true, createdAt: true },
  });
  if (rows.length !== uniqueIds.length) {
    throw new NotFoundException('Source message not found');
  }
  return sortCoreMessagesByCreatedAtId(rows);
}
