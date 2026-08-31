import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type MessengerConversationZone } from '@nbos/database';
import { addCoreCollectionItem } from './messenger-core-collection.ops';
import {
  canReadConversation,
  ensureClientFavoritesCollection,
  ensureInternalFavoritesCollection,
  removeCoreCollectionItem,
} from './messenger-core-collection-list.ops';
import {
  MESSENGER_CORE_CLIENT_ZONE,
  MESSENGER_CORE_INTERNAL_ZONE,
} from './messenger-core.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function toggleInternalFavorite(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<{ favorite: boolean; collectionId: string }> {
  return toggleFavoriteForZone(prisma, employeeId, conversationId, MESSENGER_CORE_INTERNAL_ZONE);
}

export async function toggleClientFavorite(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<{ favorite: boolean; collectionId: string }> {
  return toggleFavoriteForZone(prisma, employeeId, conversationId, MESSENGER_CORE_CLIENT_ZONE);
}

async function toggleFavoriteForZone(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
  zone: MessengerConversationZone,
): Promise<{ favorite: boolean; collectionId: string }> {
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { zone: true },
  });
  if (!conversation) throw new NotFoundException('Conversation not found');
  if (conversation.zone !== zone) {
    throw new BadRequestException(
      zone === MESSENGER_CORE_INTERNAL_ZONE
        ? 'Favorites on Internal Messenger accept Internal conversations only'
        : 'Favorites on Client Messenger accept Client conversations only',
    );
  }
  if (!(await canReadConversation(prisma, employeeId, conversationId))) {
    throw new NotFoundException('Conversation not found');
  }
  const favorites =
    zone === MESSENGER_CORE_INTERNAL_ZONE
      ? await ensureInternalFavoritesCollection(prisma, employeeId)
      : await ensureClientFavoritesCollection(prisma, employeeId);
  const existing = await prisma.messengerConversationCollectionItem.findUnique({
    where: {
      collectionId_conversationId: { collectionId: favorites.id, conversationId },
    },
  });
  if (existing) {
    await removeCoreCollectionItem(prisma, favorites.id, conversationId);
    await upsertFavoriteSetting(prisma, employeeId, conversationId, false);
    return { favorite: false, collectionId: favorites.id };
  }
  await addCoreCollectionItem(prisma, favorites.id, conversationId);
  await upsertFavoriteSetting(prisma, employeeId, conversationId, true);
  return { favorite: true, collectionId: favorites.id };
}

async function upsertFavoriteSetting(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
  favorite: boolean,
): Promise<void> {
  await prisma.messengerUserConversationSetting.upsert({
    where: { conversationId_employeeId: { conversationId, employeeId } },
    create: { conversationId, employeeId, favorite },
    update: { favorite },
  });
}
