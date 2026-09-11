import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type MessengerCollectionVisibility,
  type MessengerConversationZone,
} from '@nbos/database';
import { MESSENGER_CORE_COLLECTION_ZONE_MISMATCH } from './messenger-core.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerCoreCollectionDto = {
  id: string;
  name: string;
  visibility: MessengerCollectionVisibility;
  zone: MessengerConversationZone;
  ownerEmployeeId: string;
};

export async function createCoreCollection(
  prisma: PrismaLike,
  input: {
    name: string;
    visibility: MessengerCollectionVisibility;
    zone: MessengerConversationZone;
    ownerEmployeeId: string;
  },
): Promise<MessengerCoreCollectionDto> {
  const created = await prisma.messengerConversationCollection.create({
    data: {
      name: input.name,
      visibility: input.visibility,
      zone: input.zone,
      ownerEmployeeId: input.ownerEmployeeId,
      members:
        input.visibility === 'SHARED'
          ? { create: { employeeId: input.ownerEmployeeId } }
          : undefined,
    },
  });
  return {
    id: created.id,
    name: created.name,
    visibility: created.visibility,
    zone: created.zone,
    ownerEmployeeId: created.ownerEmployeeId,
  };
}

export async function addCoreCollectionMember(
  prisma: PrismaLike,
  collectionId: string,
  employeeId: string,
): Promise<{ id: string }> {
  const collection = await prisma.messengerConversationCollection.findUnique({
    where: { id: collectionId },
    select: { visibility: true },
  });
  if (!collection) throw new NotFoundException('Collection not found');
  if (collection.visibility !== 'SHARED') {
    throw new ForbiddenException('Only SHARED collections have membership');
  }
  const row = await prisma.messengerConversationCollectionMember.upsert({
    where: { collectionId_employeeId: { collectionId, employeeId } },
    create: { collectionId, employeeId },
    update: {},
    select: { id: true },
  });
  return row;
}

export async function addCoreCollectionItem(
  prisma: PrismaLike,
  collectionId: string,
  conversationId: string,
): Promise<{ id: string }> {
  const [collection, conversation] = await Promise.all([
    prisma.messengerConversationCollection.findUnique({
      where: { id: collectionId },
      select: { zone: true },
    }),
    prisma.messengerConversation.findUnique({
      where: { id: conversationId },
      select: { zone: true },
    }),
  ]);
  if (!collection) throw new NotFoundException('Collection not found');
  if (!conversation) throw new NotFoundException('Conversation not found');
  if (collection.zone !== conversation.zone) {
    throw new BadRequestException(MESSENGER_CORE_COLLECTION_ZONE_MISMATCH);
  }
  const created = await prisma.messengerConversationCollectionItem.create({
    data: { collectionId, conversationId },
    select: { id: true },
  });
  return created;
}

export async function isCoreCollectionMember(
  prisma: PrismaLike,
  collectionId: string,
  employeeId: string,
): Promise<boolean> {
  const collection = await prisma.messengerConversationCollection.findUnique({
    where: { id: collectionId },
    select: { visibility: true, ownerEmployeeId: true },
  });
  if (!collection) return false;
  if (collection.ownerEmployeeId === employeeId) return true;
  if (collection.visibility !== 'SHARED') return false;
  const member = await prisma.messengerConversationCollectionMember.findUnique({
    where: { collectionId_employeeId: { collectionId, employeeId } },
    select: { id: true },
  });
  return Boolean(member);
}
