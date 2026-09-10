import { createHash } from 'node:crypto';
import type { MessengerConversationZone, PrismaClient } from '@nbos/database';
import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';
import { MESSENGER_AUTHORIZATION_EPOCH_LENGTH } from './messenger-core-revision.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerActiveConversationGrant = {
  conversationId: string;
  level: 'VIEW' | 'EDIT';
};

export type MessengerGrantSnapshot = {
  employeeId: string;
  zone: MessengerConversationZone;
  grants: MessengerActiveConversationGrant[];
};

/**
 * Fresh active-grant snapshot for one HTTP operation. Never cached across calls.
 * Conversation IDs never leave the digest helper.
 */
export async function createMessengerGrantSnapshot(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerGrantSnapshot> {
  return {
    employeeId,
    zone,
    grants: await resolveActiveMessengerConversationGrants(prisma, employeeId, zone),
  };
}

export async function loadActiveMessengerConversationGrants(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerActiveConversationGrant[]> {
  return (await createMessengerGrantSnapshot(prisma, employeeId, zone)).grants;
}

export async function loadMessengerGrantAclDigest(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<string> {
  return digestMessengerGrantSnapshot(await createMessengerGrantSnapshot(prisma, employeeId, zone));
}

export function digestMessengerGrantSnapshot(snapshot: MessengerGrantSnapshot): string {
  return digestMessengerGrantSet(snapshot.grants);
}

export function digestMessengerGrantSet(
  grants: readonly MessengerActiveConversationGrant[],
): string {
  const tokens = grants.map((grant) => `${grant.conversationId}:${grant.level}`).sort();
  return createHash('sha256')
    .update(tokens.join('|'))
    .digest('hex')
    .slice(0, MESSENGER_AUTHORIZATION_EPOCH_LENGTH);
}

export function viewGrantIdsFromSnapshot(
  snapshot: MessengerGrantSnapshot,
  viewScope: string,
): string[] {
  if (viewScope === 'ALL') return [];
  return snapshot.grants.map((grant) => grant.conversationId);
}

export function editGrantIdsFromSnapshot(
  snapshot: MessengerGrantSnapshot,
  editScope: string,
): Set<string> {
  if (editScope === 'ALL' || editScope === 'NONE') return new Set();
  return new Set(
    snapshot.grants.flatMap((grant) => (grant.level === 'EDIT' ? [grant.conversationId] : [])),
  );
}

async function resolveActiveMessengerConversationGrants(
  prisma: PrismaLike,
  employeeId: string,
  zone: MessengerConversationZone,
): Promise<MessengerActiveConversationGrant[]> {
  const rows = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
      employeeId,
      level: { in: ['VIEW', 'EDIT'] },
      ...activeResourceAccessGrantWhere(),
    },
    select: { resourceId: true, level: true },
  });
  if (rows.length === 0) return [];
  const inZone = await prisma.messengerConversation.findMany({
    where: { zone, id: { in: rows.map((row) => row.resourceId) } },
    select: { id: true },
  });
  const zoneIds = new Set(inZone.map((row) => row.id));
  return rows.flatMap((row) => {
    if (!zoneIds.has(row.resourceId)) return [];
    if (row.level !== 'VIEW' && row.level !== 'EDIT') return [];
    return [{ conversationId: row.resourceId, level: row.level }];
  });
}
