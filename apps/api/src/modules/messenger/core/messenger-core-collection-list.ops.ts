import { PrismaClient } from '@nbos/database';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import {
  MESSENGER_CORE_FAVORITES_NAME,
  MESSENGER_CORE_INTERNAL_ZONE,
} from './messenger-core.constants';
import {
  createCoreCollection,
  type MessengerCoreCollectionDto,
} from './messenger-core-collection.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listInternalCollections(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerCoreCollectionDto[]> {
  const rows = await prisma.messengerConversationCollection.findMany({
    where: {
      zone: MESSENGER_CORE_INTERNAL_ZONE,
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

export async function listAclFilteredCollectionItems(
  prisma: PrismaLike,
  collectionId: string,
  employeeId: string,
): Promise<Array<{ conversationId: string }>> {
  const items = await prisma.messengerConversationCollectionItem.findMany({
    where: { collectionId, conversation: { zone: MESSENGER_CORE_INTERNAL_ZONE } },
    select: { conversationId: true },
    orderBy: { createdAt: 'desc' },
  });
  const allowed: Array<{ conversationId: string }> = [];
  for (const item of items) {
    if (await canReadConversation(prisma, employeeId, item.conversationId)) {
      allowed.push(item);
    }
  }
  return allowed;
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

export async function ensureInternalFavoritesCollection(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerCoreCollectionDto> {
  const existing = await prisma.messengerConversationCollection.findFirst({
    where: {
      ownerEmployeeId: employeeId,
      zone: MESSENGER_CORE_INTERNAL_ZONE,
      visibility: 'PERSONAL',
      name: MESSENGER_CORE_FAVORITES_NAME,
    },
  });
  if (existing) {
    await seedFavoritesFromSettings(prisma, employeeId, existing.id);
    return {
      id: existing.id,
      name: existing.name,
      visibility: existing.visibility,
      zone: existing.zone,
      ownerEmployeeId: existing.ownerEmployeeId,
    };
  }
  const created = await createCoreCollection(prisma, {
    name: MESSENGER_CORE_FAVORITES_NAME,
    visibility: 'PERSONAL',
    zone: MESSENGER_CORE_INTERNAL_ZONE,
    ownerEmployeeId: employeeId,
  });
  await seedFavoritesFromSettings(prisma, employeeId, created.id);
  return created;
}

async function seedFavoritesFromSettings(
  prisma: PrismaLike,
  employeeId: string,
  collectionId: string,
): Promise<void> {
  const settings = await prisma.messengerUserConversationSetting.findMany({
    where: { employeeId, favorite: true, conversation: { zone: MESSENGER_CORE_INTERNAL_ZONE } },
    select: { conversationId: true },
  });
  for (const setting of settings) {
    if (!(await canReadConversation(prisma, employeeId, setting.conversationId))) continue;
    await prisma.messengerConversationCollectionItem.upsert({
      where: {
        collectionId_conversationId: { collectionId, conversationId: setting.conversationId },
      },
      create: { collectionId, conversationId: setting.conversationId },
      update: {},
    });
  }
}
