import { NotFoundException } from '@nestjs/common';
import type { InputJsonValue, PrismaClient } from '@nbos/database';
import type { AuditService } from '../../audit/audit.service';
import {
  canSendMessage,
  canViewConversation,
} from '../access/messenger-conversation-access.op';
import { assertMessengerFileAssetsAttachable } from '../messenger-attachment-access.op';
import {
  MESSENGER_AUDIT_ACTION_CONVERSATION_MESSAGE_SENT,
  MESSENGER_AUDIT_ENTITY_CONVERSATION,
} from '../messenger-audit.constants';
import { clampMessengerPageSizeValue } from '../messenger-list-page-size';
import {
  MESSENGER_MESSAGES_DEFAULT_PAGE_SIZE,
  MESSENGER_SEARCH_MIN_QUERY_LEN,
  MESSENGER_SEARCH_PAGE_SIZE,
} from '../messenger-messages.constants';
import { snapshotMessengerSenderName } from '../messenger-prisma-message.mapper';
import {
  mapPrismaUnifiedMessageToDto,
  loadMessengerConversationMessageWindow,
} from './messenger-conversation-message.mapper';
import {
  getConversationLastOwnReadReceipt,
  markConversationReadForEmployee,
} from './messenger-conversation-read.ops';
import {
  requireMessengerUnifiedEditAccess,
  requireMessengerUnifiedViewAccess,
} from './messenger-unified-access';
import type {
  MessengerUnifiedPagedMessagesDto,
  MessengerUnifiedSearchResultDto,
} from './messenger-unified.types';

function attachmentCreateMany(fileAssetIds: string[] | undefined, actorId: string) {
  const uniqueIds = [...new Set(fileAssetIds?.map((id) => id.trim()).filter(Boolean) ?? [])];
  return uniqueIds.length > 0
    ? {
        createMany: {
          data: uniqueIds.map((fileAssetId) => ({ fileAssetId, attachedById: actorId })),
        },
      }
    : undefined;
}

export async function unifiedGetMessages(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  conversationId: string,
  params: { before?: Date; pageSize?: number },
): Promise<MessengerUnifiedPagedMessagesDto> {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  if (!(await canViewConversation(prisma, access, conversationId))) {
    throw new NotFoundException('Conversation not found');
  }
  const pageSize = clampMessengerPageSizeValue(
    params.pageSize ?? MESSENGER_MESSAGES_DEFAULT_PAGE_SIZE,
  );
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: {
      type: true,
      directParticipantLowId: true,
      directParticipantHighId: true,
    },
  });
  const [total, { rowsAsc, hasMoreOlder }, receipt] = await Promise.all([
    prisma.messengerMessage.count({ where: { conversationId, deletedAt: null } }),
    loadMessengerConversationMessageWindow(prisma, conversationId, {
      before: params.before,
      limit: pageSize,
    }),
    getConversationLastOwnReadReceipt(prisma, conversationId, employeeId),
  ]);

  let peerLastReadAt: Date | null = null;
  if (conversation?.type === 'DIRECT') {
    const peerId =
      conversation.directParticipantLowId === employeeId
        ? conversation.directParticipantHighId
        : conversation.directParticipantLowId;
    if (peerId) {
      const peerRead = await prisma.messengerConversationReadState.findUnique({
        where: { conversationId_employeeId: { conversationId, employeeId: peerId } },
        select: { lastReadAt: true },
      });
      peerLastReadAt = peerRead?.lastReadAt ?? null;
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1;
  const tailMode = params.before === undefined;
  return {
    items: rowsAsc.map((m) => mapPrismaUnifiedMessageToDto(m)),
    meta: {
      total,
      page: tailMode ? totalPages : 1,
      pageSize,
      totalPages,
      hasMoreOlder,
    },
    lastOwnMessageId: receipt.lastOwnMessageId,
    lastOwnMessageSeenByOthers: receipt.lastOwnMessageSeenByOthers,
    peerLastReadAt,
  };
}

export async function unifiedSendMessage(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  employeeId: string,
  conversationId: string,
  content: string,
  fileAssetIds: string[] | undefined,
): Promise<ReturnType<typeof mapPrismaUnifiedMessageToDto>> {
  const { access, legacy } = await requireMessengerUnifiedEditAccess(prisma, employeeId);
  if (!(await canSendMessage(prisma, access, conversationId))) {
    throw new NotFoundException('Conversation not found');
  }
  const validatedAttachments = await assertMessengerFileAssetsAttachable(
    prisma,
    legacy,
    fileAssetIds,
  );
  const snapshot = await snapshotMessengerSenderName(prisma, employeeId);
  const created = await prisma.messengerMessage.create({
    data: {
      conversationId,
      senderId: employeeId,
      senderNameSnapshot: snapshot,
      content,
      messageType: 'TEXT',
      attachments: attachmentCreateMany(validatedAttachments, employeeId),
    },
    include: { attachments: true },
  });
  await prisma.messengerConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: created.createdAt },
  });
  const changes: InputJsonValue = { messageId: created.id };
  await auditService.log({
    entityType: MESSENGER_AUDIT_ENTITY_CONVERSATION,
    entityId: conversationId,
    action: MESSENGER_AUDIT_ACTION_CONVERSATION_MESSAGE_SENT,
    userId: employeeId,
    changes,
  });
  return mapPrismaUnifiedMessageToDto(created);
}

export async function unifiedMarkRead(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  conversationId: string,
): Promise<{ lastReadAt: Date; peerEmployeeId: string | null; type: string }> {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  if (!(await canViewConversation(prisma, access, conversationId))) {
    throw new NotFoundException('Conversation not found');
  }
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: {
      type: true,
      directParticipantLowId: true,
      directParticipantHighId: true,
    },
  });
  if (!conversation) throw new NotFoundException('Conversation not found');
  const lastReadAt = await markConversationReadForEmployee(prisma, conversationId, employeeId);
  let peerEmployeeId: string | null = null;
  if (conversation.type === 'DIRECT') {
    peerEmployeeId =
      conversation.directParticipantLowId === employeeId
        ? conversation.directParticipantHighId
        : conversation.directParticipantLowId;
  }
  return { lastReadAt, peerEmployeeId, type: conversation.type };
}

export async function unifiedSearch(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  query: string,
): Promise<{ items: MessengerUnifiedSearchResultDto[] }> {
  const { access } = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  const q = query.trim();
  if (q.length < MESSENGER_SEARCH_MIN_QUERY_LEN) return { items: [] };

  const candidates = await prisma.messengerMessage.findMany({
    where: {
      deletedAt: null,
      content: { contains: q, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: MESSENGER_SEARCH_PAGE_SIZE * 3,
    select: {
      id: true,
      content: true,
      senderNameSnapshot: true,
      createdAt: true,
      conversationId: true,
      conversation: { select: { id: true, type: true, title: true } },
    },
  });

  const items: MessengerUnifiedSearchResultDto[] = [];
  for (const m of candidates) {
    if (!(await canViewConversation(prisma, access, m.conversationId))) continue;
    items.push({
      conversationId: m.conversationId,
      conversationType: m.conversation.type,
      conversationTitle: m.conversation.title?.trim() || 'Conversation',
      messageId: m.id,
      senderName: m.senderNameSnapshot,
      content: m.content,
      createdAt: m.createdAt,
    });
    if (items.length >= MESSENGER_SEARCH_PAGE_SIZE) break;
  }
  return { items };
}
