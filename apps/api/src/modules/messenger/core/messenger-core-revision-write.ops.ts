import type { MessengerConversationZone, PrismaClient } from '@nbos/database';
import { sql } from '@nbos/database';
import {
  MESSENGER_REVISION_CHANGE_ACCESS_REMOVED,
  MESSENGER_REVISION_CHANGE_CONVERSATION,
  MESSENGER_REVISION_CHANGE_FAVORITE,
  MESSENGER_REVISION_CHANGE_READ,
  type MessengerRevisionChangeKind,
} from './messenger-core-revision.constants';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function bumpGlobalConversationRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  conversationId: string,
): Promise<bigint> {
  return bumpRevision(prisma, zone, async (tx, revision) => {
    await tx.messengerConversationRevision.upsert({
      where: { zone_conversationId: { zone, conversationId } },
      create: {
        zone,
        conversationId,
        changeKind: MESSENGER_REVISION_CHANGE_CONVERSATION,
        revision,
      },
      update: { changeKind: MESSENGER_REVISION_CHANGE_CONVERSATION, revision },
    });
  });
}

export async function bumpTargetedReadRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  employeeId: string,
  conversationId: string,
): Promise<bigint> {
  return bumpTargeted(prisma, zone, employeeId, conversationId, MESSENGER_REVISION_CHANGE_READ);
}

export async function bumpTargetedFavoriteRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  employeeId: string,
  conversationId: string,
): Promise<bigint> {
  return bumpTargeted(prisma, zone, employeeId, conversationId, MESSENGER_REVISION_CHANGE_FAVORITE);
}

export async function bumpTargetedAccessRemovedRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  employeeId: string,
  conversationId: string,
): Promise<bigint> {
  return bumpTargeted(
    prisma,
    zone,
    employeeId,
    conversationId,
    MESSENGER_REVISION_CHANGE_ACCESS_REMOVED,
  );
}

export async function allocateZoneRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
): Promise<bigint> {
  const rows = await prisma.$queryRaw<Array<{ revision: bigint }>>(allocateZoneRevisionSql(zone));
  const revision = rows[0]?.revision;
  if (revision === undefined) {
    throw new Error('Messenger zone revision counter is unavailable');
  }
  return revision;
}

export async function shareLockZoneRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
): Promise<bigint> {
  const rows = await prisma.$queryRaw<Array<{ revision: bigint }>>(shareLockZoneRevisionSql(zone));
  return rows[0]?.revision ?? 0n;
}

export function allocateZoneRevisionSql(zone: MessengerConversationZone) {
  return sql`
    INSERT INTO messenger_zone_revision_counters (zone, revision, updated_at)
    VALUES (CAST(${zone} AS "MessengerConversationZone"), 1, CURRENT_TIMESTAMP)
    ON CONFLICT (zone) DO UPDATE
    SET revision = messenger_zone_revision_counters.revision + 1,
        updated_at = CURRENT_TIMESTAMP
    RETURNING revision`;
}

export function shareLockZoneRevisionSql(zone: MessengerConversationZone) {
  return sql`
    SELECT revision
    FROM messenger_zone_revision_counters
    WHERE zone = CAST(${zone} AS "MessengerConversationZone")
    FOR SHARE`;
}

async function bumpRevision(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  write: (tx: PrismaLike, revision: bigint) => Promise<void>,
): Promise<bigint> {
  return runMessengerWriteTx(prisma, async (tx) => {
    const revision = await allocateZoneRevision(tx, zone);
    await write(tx, revision);
    return revision;
  });
}

async function bumpTargeted(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  employeeId: string,
  conversationId: string,
  changeKind: MessengerRevisionChangeKind,
): Promise<bigint> {
  return bumpRevision(prisma, zone, async (tx, revision) => {
    await tx.messengerEmployeeConversationRevision.upsert({
      where: { employeeId_zone_conversationId: { employeeId, zone, conversationId } },
      create: { employeeId, zone, conversationId, changeKind, revision },
      update: { changeKind, revision },
    });
  });
}
