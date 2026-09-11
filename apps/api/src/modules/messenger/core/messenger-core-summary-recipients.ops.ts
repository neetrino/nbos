import { NotFoundException } from '@nestjs/common';
import type { MessengerConversationType, PrismaClient } from '@nbos/database';
import {
  RESOURCE_GRANT_RESOURCE_TYPE,
  type MessengerWsConversationSummaryPayload,
  type MessengerWsZone,
} from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';
import {
  loadMessengerLegacyAccessForEmployees,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import type { MessengerCoreAccessFacts } from './messenger-core-access.types';
import { requireTaskEntityAccess } from './messenger-core-task-access.ops';
import { absoluteConversationUnreadCount } from './messenger-core-unread';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type ConversationSummaryPublishInput = {
  conversationId: string;
  zone: MessengerWsZone;
  conversationType?: MessengerConversationType;
  senderId: string | null;
  lastMessageAt: Date;
  lastMessagePreview: string;
  connectedEmployeeIds: string[];
};

export type ConversationSummaryRecipient = {
  employeeId: string;
  payload: MessengerWsConversationSummaryPayload;
};

export type RecipientAclRow = {
  employeeId: string;
  access: MessengerLegacyAccessContext;
  facts: MessengerCoreAccessFacts;
  lastReadAt: Date | null;
};

/**
 * Recipient-scoped summaries for currently connected employees only.
 * Query cost: 1 employee batch + 1 participants IN + 1 grants IN + 1 readStates IN;
 * TASK adds 1 PRIMARY link and per-candidate `requireTaskEntityAccess` (HTTP Task policy).
 */
export async function deriveRecipientConversationSummaries(
  prisma: PrismaLike,
  input: ConversationSummaryPublishInput,
): Promise<ConversationSummaryRecipient[]> {
  const connectedIds = [...new Set(input.connectedEmployeeIds.filter((id) => id.length > 0))];
  if (connectedIds.length === 0) return [];
  const rows = await loadRecipientAclRows(prisma, input, connectedIds);
  const readers = rows.filter((row) => evaluateMessengerCoreAccess(row.facts).canRead);
  const allowed = await filterTaskReaders(prisma, input, readers);
  return allowed.map((row) => toSummaryRecipient(row, input));
}

export function absoluteRecipientUnreadCount(input: {
  employeeId: string;
  senderId: string | null;
  lastMessageAt: Date;
  lastReadAt: Date | null;
}): number {
  return absoluteConversationUnreadCount({
    viewerEmployeeId: input.employeeId,
    latestSenderId: input.senderId,
    lastMessageAt: input.lastMessageAt,
    lastReadAt: input.lastReadAt,
  });
}

async function loadRecipientAclRows(
  prisma: PrismaLike,
  input: ConversationSummaryPublishInput,
  connectedIds: string[],
): Promise<RecipientAclRow[]> {
  const accessById = await loadMessengerLegacyAccessForEmployees(prisma, connectedIds);
  const [participants, grants, readStates] = await Promise.all([
    prisma.messengerConversationParticipant.findMany({
      where: {
        conversationId: input.conversationId,
        employeeId: { in: connectedIds },
        leftAt: null,
      },
      select: { employeeId: true, role: true },
    }),
    prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
        resourceId: input.conversationId,
        employeeId: { in: connectedIds },
        ...activeResourceAccessGrantWhere(),
      },
      select: { employeeId: true, level: true },
    }),
    prisma.messengerConversationReadState.findMany({
      where: { conversationId: input.conversationId, employeeId: { in: connectedIds } },
      select: { employeeId: true, lastReadAt: true },
    }),
  ]);
  return assembleRecipientAclRows(
    input,
    connectedIds,
    accessById,
    participants,
    grants,
    readStates,
  );
}

function assembleRecipientAclRows(
  input: ConversationSummaryPublishInput,
  connectedIds: string[],
  accessById: Map<string, MessengerLegacyAccessContext>,
  participants: Array<{ employeeId: string; role: MessengerCoreAccessFacts['participantRole'] }>,
  grants: Array<{ employeeId: string; level: string }>,
  readStates: Array<{ employeeId: string; lastReadAt: Date }>,
): RecipientAclRow[] {
  const participantById = new Map(participants.map((row) => [row.employeeId, row]));
  const grantById = new Map(grants.map((row) => [row.employeeId, row.level]));
  const readById = new Map(readStates.map((row) => [row.employeeId, row.lastReadAt]));
  const rows: RecipientAclRow[] = [];
  for (const employeeId of connectedIds) {
    const access = accessById.get(employeeId);
    if (!access || access.viewScope === 'NONE') continue;
    const participant = participantById.get(employeeId);
    const grantLevel = grantById.get(employeeId);
    rows.push({
      employeeId,
      access,
      lastReadAt: readById.get(employeeId) ?? null,
      facts: {
        conversationId: input.conversationId,
        zone: input.zone,
        conversationType: input.conversationType,
        viewScope: access.viewScope,
        editScope: access.editScope,
        clientReadScope: access.clientReadScope,
        clientSendScope: access.clientSendScope,
        isActiveParticipant: Boolean(participant),
        participantRole: participant?.role ?? null,
        grantLevel: grantLevel === 'EDIT' || grantLevel === 'VIEW' ? grantLevel : null,
      },
    });
  }
  return rows;
}

async function filterTaskReaders(
  prisma: PrismaLike,
  input: ConversationSummaryPublishInput,
  readers: RecipientAclRow[],
): Promise<RecipientAclRow[]> {
  if (input.conversationType !== 'TASK' || readers.length === 0) return readers;
  const link = await prisma.messengerConversationLink.findFirst({
    where: { conversationId: input.conversationId, entityType: 'TASK', relationType: 'PRIMARY' },
    select: { entityId: true },
  });
  if (!link) return [];
  const allowed: RecipientAclRow[] = [];
  for (const reader of readers) {
    if (await employeeHasTaskEntityAccess(prisma, link.entityId, reader.access)) {
      allowed.push(reader);
    }
  }
  return allowed;
}

async function employeeHasTaskEntityAccess(
  prisma: PrismaLike,
  taskId: string,
  access: MessengerLegacyAccessContext,
): Promise<boolean> {
  try {
    await requireTaskEntityAccess(prisma, taskId, {
      employeeId: access.employeeId,
      departmentIds: access.departmentIds,
      viewScope: access.tasksViewScope,
    });
    return true;
  } catch (error) {
    if (error instanceof NotFoundException) return false;
    throw error;
  }
}

function toSummaryRecipient(
  row: RecipientAclRow,
  input: ConversationSummaryPublishInput,
): ConversationSummaryRecipient {
  return {
    employeeId: row.employeeId,
    payload: {
      conversationId: input.conversationId,
      zone: input.zone,
      lastMessageAt: input.lastMessageAt.toISOString(),
      lastMessagePreview: input.lastMessagePreview,
      unreadCount: absoluteRecipientUnreadCount({
        employeeId: row.employeeId,
        senderId: input.senderId,
        lastMessageAt: input.lastMessageAt,
        lastReadAt: row.lastReadAt,
      }),
      lastReadAt: row.lastReadAt ? row.lastReadAt.toISOString() : null,
    },
  };
}
