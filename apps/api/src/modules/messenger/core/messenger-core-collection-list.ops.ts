import { PrismaClient, type MessengerConversationZone } from '@nbos/database';
import { MESSENGER_CORE_CLIENT_ZONE, MESSENGER_CORE_INTERNAL_ZONE } from './messenger-core.constants';
import type { MessengerCoreCollectionDto } from './messenger-core-collection.ops';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import {
  ensureClientFavoritesCollection,
  ensureInternalFavoritesCollection,
} from './messenger-core-favorites-ensure.ops';

export { ensureClientFavoritesCollection, ensureInternalFavoritesCollection };

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listClientCollections(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerCoreCollectionDto[]> {
  return listCollectionsForZone(prisma, employeeId, MESSENGER_CORE_CLIENT_ZONE);
}

export async function listInternalCollections(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerCoreCollectionDto[]> {
  return listCollectionsForZone(prisma, employeeId, MESSENGER_CORE_INTERNAL_ZONE);
}

export async function listCollectionItemIds(
  prisma: PrismaLike,
  collectionId: string,
  zone: MessengerConversationZone,
): Promise<string[]> {
  const items = await prisma.messengerConversationCollectionItem.findMany({
    where: { collectionId, conversation: { zone } },
    select: { conversationId: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return items.map((item) => item.conversationId);
}

export async function canReadConversation(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<boolean> {
  const loaded = await loadMessengerCoreAccessFacts(prisma, employeeId, conversationId);
  if (!loaded.facts) return false;
  return evaluateMessengerCoreAccess(loaded.facts).canRead;
}

export async function removeCoreCollectionItem(
  prisma: PrismaLike,
  collectionId: string,
  conversationId: string,
): Promise<void> {
  await prisma.messengerConversationCollectionItem.deleteMany({
    where: { collectionId, conversationId },
  });
}

async function listCollectionsForZone(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerCoreCollectionDto[]> {
  const rows = await prisma.messengerConversationCollection.findMany({
    where: {
      zone,
      OR: [
        { ownerEmployeeId: employeeId },
        { visibility: 'SHARED', members: { some: { employeeId } } },
      ],
    },
    orderBy: [{ visibility: 'asc' }, { name: 'asc' }],
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    visibility: row.visibility,
    zone: row.zone,
    ownerEmployeeId: row.ownerEmployeeId,
  }));
}
