import type { PrismaClient, TransactionClient, MessengerConversationZone } from '@nbos/database';
import {
  MESSENGER_CORE_CLIENT_ZONE,
  MESSENGER_CORE_FAVORITES_NAME,
  MESSENGER_CORE_INTERNAL_ZONE,
} from './messenger-core.constants';
import {
  createCoreCollection,
  type MessengerCoreCollectionDto,
} from './messenger-core-collection.ops';
import { backfillFavoritesFromSettings } from './messenger-core-favorites-backfill.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;
type FavoritesTx = TransactionClient;

const FAVORITES_LOCK_PREFIX = 'messenger-favorites';

export async function ensureClientFavoritesCollection(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerCoreCollectionDto> {
  return ensureFavoritesCollection(prisma, employeeId, MESSENGER_CORE_CLIENT_ZONE);
}

export async function ensureInternalFavoritesCollection(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerCoreCollectionDto> {
  return ensureFavoritesCollection(prisma, employeeId, MESSENGER_CORE_INTERNAL_ZONE);
}

export async function ensureFavoritesCollection(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerCoreCollectionDto> {
  return prisma.$transaction((tx) => initializeFavoritesCollection(tx, employeeId, zone));
}

async function initializeFavoritesCollection(
  tx: FavoritesTx,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerCoreCollectionDto> {
  await lockFavoritesInit(tx, employeeId, zone);
  const collection = await findOrCreateFavorites(tx, employeeId, zone);
  await backfillFavoritesFromSettings(asMessengerDb(tx), employeeId, collection.id, zone);
  return collection;
}

async function lockFavoritesInit(
  tx: FavoritesTx,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${FAVORITES_LOCK_PREFIX}:${zone}:${employeeId}`}))`;
}

async function findOrCreateFavorites(
  tx: FavoritesTx,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerCoreCollectionDto> {
  const existing = await tx.messengerConversationCollection.findFirst({
    where: {
      ownerEmployeeId: employeeId,
      zone,
      visibility: 'PERSONAL',
      name: MESSENGER_CORE_FAVORITES_NAME,
    },
  });
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      visibility: existing.visibility,
      zone: existing.zone,
      ownerEmployeeId: existing.ownerEmployeeId,
    };
  }
  return createCoreCollection(asMessengerDb(tx), {
    name: MESSENGER_CORE_FAVORITES_NAME,
    visibility: 'PERSONAL',
    zone,
    ownerEmployeeId: employeeId,
  });
}

function asMessengerDb(tx: FavoritesTx): PrismaLike {
  return tx as unknown as PrismaLike;
}
