import type { PrismaClient } from '@nbos/database';
import {
  canAccessLinkedEntity,
  type MessengerLinkEntity,
} from './messenger-entity-access.op';
import {
  messengerViewBypassesRowFilter,
  type MessengerAccessContext,
} from './messenger-access.types';

/** ACL for unified `MessengerConversation` (wired to Internal Messenger REST/WS). */

function mapLinkEntityType(raw: string): MessengerLinkEntity | null {
  switch (raw) {
    case 'PROJECT':
    case 'PRODUCT':
    case 'DEAL':
    case 'TASK':
    case 'WORKSPACE':
      return raw;
    default:
      return null;
  }
}

export async function canViewConversation(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  conversationId: string,
): Promise<boolean> {
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      type: true,
      participants: {
        where: { employeeId: access.employeeId, leftAt: null },
        select: { id: true },
        take: 1,
      },
      links: { select: { entityType: true, entityId: true } },
    },
  });
  if (!conversation) return false;
  if (messengerViewBypassesRowFilter(access.viewScope)) return true;
  if (conversation.participants.length > 0) return true;

  if (conversation.type === 'DIRECT') {
    return false;
  }

  for (const link of conversation.links) {
    const entityType = mapLinkEntityType(link.entityType);
    if (!entityType) continue;
    if (await canAccessLinkedEntity(prisma, access, entityType, link.entityId)) {
      return true;
    }
  }

  // Freeform internal groups without entity links: module VIEW (non-NONE) only.
  if (conversation.type === 'INTERNAL_GROUP' && conversation.links.length === 0) {
    return Boolean(access.viewScope && access.viewScope !== 'NONE');
  }

  return false;
}

export async function canSendMessage(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  conversationId: string,
): Promise<boolean> {
  if (!access.editScope || access.editScope === 'NONE') return false;
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: {
      status: true,
      participants: {
        where: { employeeId: access.employeeId, leftAt: null },
        select: { role: true },
        take: 1,
      },
    },
  });
  if (!conversation) return false;
  if (conversation.status === 'LOCKED') return false;
  const role = conversation.participants[0]?.role;
  if (role === 'READ_ONLY') return false;
  return canViewConversation(prisma, access, conversationId);
}

export async function canManageConversation(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  conversationId: string,
): Promise<boolean> {
  if (messengerViewBypassesRowFilter(access.viewScope)) return true;
  const participant = await prisma.messengerConversationParticipant.findFirst({
    where: {
      conversationId,
      employeeId: access.employeeId,
      leftAt: null,
      role: { in: ['OWNER', 'ADMIN'] },
    },
    select: { id: true },
  });
  return Boolean(participant);
}
