import type { PrismaClient, MessengerConversationZone } from '@nbos/database';
import { loadMessengerLegacyAccess } from '../access/messenger-legacy-channel-access.op';
import { MESSENGER_CORE_INTERNAL_ZONE } from './messenger-core.constants';
import { listAccessibleClientConversationsByIds } from './messenger-core-client-list.ops';
import { listAccessibleInternalConversationsByIds } from './messenger-core-internal-list.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * Idempotent Favorites repair from `favorite` settings. Not invoked on ordinary GETs.
 */
export async function backfillFavoritesFromSettings(
  prisma: PrismaLike,
  employeeId: string,
  collectionId: string,
  zone: MessengerConversationZone,
): Promise<number> {
  const settings = await prisma.messengerUserConversationSetting.findMany({
    where: { employeeId, favorite: true, conversation: { zone } },
    select: { conversationId: true },
  });
  const settingIds = settings.map((row) => row.conversationId);
  if (settingIds.length === 0) return 0;
  const allowedIds = await loadAccessibleFavoriteIds(prisma, employeeId, zone, settingIds);
  if (allowedIds.length === 0) return 0;
  const written = await prisma.messengerConversationCollectionItem.createMany({
    data: allowedIds.map((conversationId) => ({ collectionId, conversationId })),
    skipDuplicates: true,
  });
  return written.count;
}

async function loadAccessibleFavoriteIds(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
  conversationIds: string[],
): Promise<string[]> {
  const access = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!access || access.viewScope === 'NONE') return [];
  if (zone === MESSENGER_CORE_INTERNAL_ZONE) {
    const items = await listAccessibleInternalConversationsByIds(
      prisma,
      employeeId,
      access.viewScope,
      conversationIds,
      access.editScope,
      {
        employeeId: access.employeeId,
        departmentIds: access.departmentIds,
        viewScope: access.tasksViewScope,
      },
    );
    return items.map((item) => item.id);
  }
  const items = await listAccessibleClientConversationsByIds(
    prisma,
    employeeId,
    access.clientReadScope,
    access.clientSendScope,
    conversationIds,
  );
  return items.map((item) => item.id);
}
