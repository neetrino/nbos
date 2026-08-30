import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { CreateMessengerCoreReferenceInput } from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function createCoreMessageReference(
  prisma: PrismaLike,
  input: CreateMessengerCoreReferenceInput,
): Promise<{ id: string; sourceMessageId: string }> {
  if (
    !input.targetMessageId &&
    !input.referencedByMessageId &&
    !(input.targetEntityType && input.targetEntityId)
  ) {
    throw new BadRequestException('Reference requires a holder message or target entity');
  }
  const source = await prisma.messengerMessage.findUnique({
    where: { id: input.sourceMessageId },
    select: { id: true, conversationId: true },
  });
  if (!source) {
    throw new NotFoundException('Source message not found');
  }
  const created = await prisma.messengerMessageReference.create({
    data: {
      sourceMessageId: source.id,
      sourceConversationId: source.conversationId,
      targetMessageId: input.targetMessageId ?? input.referencedByMessageId,
      entityType: input.targetEntityType,
      entityId: input.targetEntityId,
      purpose: input.purpose,
    },
    select: { id: true, sourceMessageId: true },
  });
  return created;
}

export async function deleteCoreMessageReference(
  prisma: PrismaLike,
  referenceId: string,
): Promise<{ sourceMessageId: string }> {
  const existing = await prisma.messengerMessageReference.findUnique({
    where: { id: referenceId },
    select: { sourceMessageId: true },
  });
  if (!existing) {
    throw new NotFoundException('Message reference not found');
  }
  await prisma.messengerMessageReference.delete({ where: { id: referenceId } });
  return { sourceMessageId: existing.sourceMessageId };
}
