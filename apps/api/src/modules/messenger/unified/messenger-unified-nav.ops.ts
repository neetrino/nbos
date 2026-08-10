import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { primaryEntityTypeForConversationType } from '../access/messenger-canonical.util';
import {
  canSendMessage,
  canViewConversation,
} from '../access/messenger-conversation-access.op';
import { canAccessLinkedEntity } from '../access/messenger-entity-access.op';
import {
  ensureMessengerConversation,
  type EnsureConversationInput,
} from './messenger-conversation-ensure.ops';
import { listMessengerL1Entities } from './messenger-l1-entities.ops';
import {
  listConversationsForEntity,
  listConversationsForProjectTree,
  listDirectConversationsUnified,
  listInternalGroupConversations,
} from './messenger-l2-conversations.ops';
import { requireMessengerUnifiedViewAccess } from './messenger-unified-access';
import type {
  MessengerConversationDetailDto,
  MessengerInternalTab,
  MessengerL1EntityDto,
  MessengerL2ConversationDto,
} from './messenger-unified.types';

export async function unifiedListL1Entities(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  tab: MessengerInternalTab,
  search?: string,
): Promise<MessengerL1EntityDto[]> {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  return listMessengerL1Entities(prisma, access, tab, search);
}

export async function unifiedListL2Conversations(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  opts: {
    entityType?: 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'DIRECT_BUCKET';
    entityId?: string;
    projectTree?: boolean;
    includeInternalGroups?: boolean;
  },
): Promise<MessengerL2ConversationDto[]> {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  if (opts.entityType === 'DIRECT_BUCKET') {
    return listDirectConversationsUnified(prisma, access);
  }
  if (!opts.entityType || !opts.entityId) {
    if (opts.includeInternalGroups) {
      return listInternalGroupConversations(prisma, access);
    }
    return [];
  }
  // Project Topics are entity-scoped only — never append org-wide INTERNAL_GROUP.
  if (opts.projectTree && opts.entityType === 'PROJECT') {
    return listConversationsForProjectTree(prisma, access, opts.entityId);
  }
  return listConversationsForEntity(prisma, access, opts.entityType, opts.entityId);
}

export async function unifiedEnsureConversation(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  input: EnsureConversationInput,
) {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  if (input.type !== 'DIRECT') {
    const entityType = primaryEntityTypeForConversationType(input.type);
    const ok = await canAccessLinkedEntity(prisma, access, entityType, input.entityId);
    if (!ok) {
      throw new NotFoundException('Entity not found');
    }
  }
  return ensureMessengerConversation(prisma, {
    ...input,
    createdById: employeeId,
  } as EnsureConversationInput);
}

export async function unifiedGetConversation(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  conversationId: string,
): Promise<MessengerConversationDetailDto> {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  if (!(await canViewConversation(prisma, access, conversationId))) {
    throw new NotFoundException('Conversation not found');
  }
  const row = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      canonicalKey: true,
      lastMessageAt: true,
      directParticipantLowId: true,
      directParticipantHighId: true,
      links: {
        where: { relationType: 'PRIMARY' },
        take: 1,
        select: { entityType: true, entityId: true },
      },
    },
  });
  if (!row) throw new NotFoundException('Conversation not found');
  const primary = row.links[0] ?? null;
  let peerEmployeeId: string | null = null;
  if (row.type === 'DIRECT') {
    peerEmployeeId =
      row.directParticipantLowId === employeeId
        ? row.directParticipantHighId
        : row.directParticipantLowId;
  }
  return {
    id: row.id,
    type: row.type,
    title: row.title?.trim() || 'Conversation',
    status: row.status,
    canonicalKey: row.canonicalKey,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    primaryEntityType: primary?.entityType ?? null,
    primaryEntityId: primary?.entityId ?? null,
    peerEmployeeId,
    canSend: await canSendMessage(prisma, access, conversationId),
  };
}
