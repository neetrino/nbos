import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { InputJsonValue } from '@nbos/database';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MESSENGER_AUDIT_ACTION_CHANNEL_CREATED,
  MESSENGER_AUDIT_ACTION_CHANNEL_MESSAGE_SENT,
  MESSENGER_AUDIT_ACTION_DM_MESSAGE_SENT,
  MESSENGER_AUDIT_ENTITY_CHANNEL,
  MESSENGER_AUDIT_ENTITY_DM_THREAD,
} from './messenger-audit.constants';
import {
  channelTypeFromApi,
  channelTypeToApi,
  type MessengerChannelTypeApi,
} from './messenger-channel-type.util';
import { orderedParticipantIds } from './messenger-participants.util';
import { MessengerGateway } from './messenger.gateway';
import { getChannelLastOwnReadReceipt } from './messenger-channel-read-receipt.ops';
import { loadMessengerDmConversations } from './messenger-dm-conversations.query';
import {
  mapPrismaChannelMessageToDto,
  mapPrismaDmMessageToDto,
  snapshotMessengerSenderName,
} from './messenger-prisma-message.mapper';
import {
  countChannelUnreadForEmployee,
  markChannelReadForEmployee,
  markDmThreadReadForEmployee,
} from './messenger-read-state.ops';
import type {
  MessengerChannelDto,
  MessengerChannelPagedMessagesDto,
  MessengerDmConversationDto,
  MessengerDmPagedMessagesDto,
  MessengerSearchResultDto,
  MessengerMessageDto,
} from './messenger.types';

export type {
  MessengerChannelDto,
  MessengerChannelPagedMessagesDto,
  MessengerDmConversationDto,
  MessengerDmPagedMessagesDto,
  MessengerMessageDto,
} from './messenger.types';

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 25;

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

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly messengerGateway: MessengerGateway,
  ) {}

  async getChannels(employeeId: string): Promise<MessengerChannelDto[]> {
    const rows = await this.prisma.messengerChannel.findMany({ orderBy: { createdAt: 'asc' } });
    const unreadCounts = await Promise.all(
      rows.map((r) => countChannelUnreadForEmployee(this.prisma, r.id, employeeId)),
    );
    return rows.map((r, i) => ({
      id: r.id,
      name: r.name,
      projectId: r.projectId,
      type: channelTypeToApi(r.type),
      createdAt: r.createdAt,
      unreadCount: unreadCounts[i] ?? 0,
    }));
  }

  async createChannel(
    name: string,
    projectId: string,
    type: MessengerChannelTypeApi,
    actorEmployeeId: string,
  ): Promise<MessengerChannelDto> {
    const created = await this.prisma.messengerChannel.create({
      data: {
        name,
        projectId,
        type: channelTypeFromApi(type),
      },
    });
    this.logger.log(`Channel created: ${name}`);
    const changes: InputJsonValue = {
      name: created.name,
      logicalProjectKey: created.projectId,
      type: channelTypeToApi(created.type),
    };
    await this.auditService.log({
      entityType: MESSENGER_AUDIT_ENTITY_CHANNEL,
      entityId: created.id,
      action: MESSENGER_AUDIT_ACTION_CHANNEL_CREATED,
      userId: actorEmployeeId,
      changes,
    });
    return {
      id: created.id,
      name: created.name,
      projectId: created.projectId,
      type: channelTypeToApi(created.type),
      createdAt: created.createdAt,
      unreadCount: 0,
    };
  }

  async getMessages(
    channelId: string,
    viewerId: string,
    pagination: PaginationParams = {},
  ): Promise<MessengerChannelPagedMessagesDto> {
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    const emptyMeta = {
      total: 0,
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: 1,
    };
    if (!channel) {
      return {
        items: [] as MessengerMessageDto[],
        meta: emptyMeta,
        lastOwnMessageId: null,
        lastOwnMessageSeenByOthers: false,
      };
    }
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const skip = (page - 1) * pageSize;
    const [total, rows, receipt] = await Promise.all([
      this.prisma.messengerChannelMessage.count({ where: { channelId } }),
      this.prisma.messengerChannelMessage.findMany({
        where: { channelId },
        include: { attachments: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      getChannelLastOwnReadReceipt(this.prisma, channelId, viewerId),
    ]);
    return {
      items: rows.map((m) => mapPrismaChannelMessageToDto(m)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
      lastOwnMessageId: receipt.lastOwnMessageId,
      lastOwnMessageSeenByOthers: receipt.lastOwnMessageSeenByOthers,
    };
  }

  async sendMessage(
    channelId: string,
    senderId: string,
    _senderNameFromJwt: string,
    content: string,
    fileAssetIds?: string[],
  ): Promise<MessengerMessageDto> {
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const snapshot = await snapshotMessengerSenderName(this.prisma, senderId);
    const created = await this.prisma.messengerChannelMessage.create({
      data: {
        channelId,
        senderId,
        senderNameSnapshot: snapshot,
        content,
        attachments: attachmentCreateMany(fileAssetIds, senderId),
      },
      include: { attachments: true },
    });
    const channelMessageAudit: InputJsonValue = {
      messageId: created.id,
      channelName: channel.name,
    };
    await this.auditService.log({
      entityType: MESSENGER_AUDIT_ENTITY_CHANNEL,
      entityId: channelId,
      action: MESSENGER_AUDIT_ACTION_CHANNEL_MESSAGE_SENT,
      userId: senderId,
      changes: channelMessageAudit,
    });
    const dto = mapPrismaChannelMessageToDto(created);
    this.messengerGateway.emitChannelMessage(channelId, dto);
    return dto;
  }

  async getDirectMessages(
    viewerId: string,
    peerId: string,
    pagination: PaginationParams = {},
  ): Promise<MessengerDmPagedMessagesDto> {
    const [a, b] = orderedParticipantIds(viewerId, peerId);
    const thread = await this.prisma.messengerDirectThread.findUnique({
      where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
    });
    const emptyMeta = {
      total: 0,
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: 1,
    };
    if (!thread) {
      return {
        items: [] as MessengerMessageDto[],
        meta: emptyMeta,
        peerLastReadAt: null,
      };
    }
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const skip = (page - 1) * pageSize;
    const where = { threadId: thread.id };
    const [total, rows, peerRead] = await Promise.all([
      this.prisma.messengerDirectMessage.count({ where }),
      this.prisma.messengerDirectMessage.findMany({
        where,
        include: { attachments: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.messengerDirectThreadReadState.findUnique({
        where: { threadId_employeeId: { threadId: thread.id, employeeId: peerId } },
        select: { lastReadAt: true },
      }),
    ]);
    return {
      items: rows.map((m) => mapPrismaDmMessageToDto(m, thread.id)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
      peerLastReadAt: peerRead?.lastReadAt ?? null,
    };
  }

  async sendDirectMessage(
    senderId: string,
    _senderNameFromJwt: string,
    recipientId: string,
    content: string,
    fileAssetIds?: string[],
  ): Promise<MessengerMessageDto> {
    const [a, b] = orderedParticipantIds(senderId, recipientId);
    const thread = await this.prisma.messengerDirectThread.upsert({
      where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
      create: { participantAId: a, participantBId: b },
      update: {},
    });
    const snapshot = await snapshotMessengerSenderName(this.prisma, senderId);
    const created = await this.prisma.messengerDirectMessage.create({
      data: {
        threadId: thread.id,
        senderId,
        senderNameSnapshot: snapshot,
        content,
        attachments: attachmentCreateMany(fileAssetIds, senderId),
      },
      include: { attachments: true },
    });
    const dmAudit: InputJsonValue = {
      messageId: created.id,
      recipientId,
    };
    await this.auditService.log({
      entityType: MESSENGER_AUDIT_ENTITY_DM_THREAD,
      entityId: thread.id,
      action: MESSENGER_AUDIT_ACTION_DM_MESSAGE_SENT,
      userId: senderId,
      changes: dmAudit,
    });
    const dto = mapPrismaDmMessageToDto(created, thread.id);
    this.messengerGateway.emitDmToParticipants(senderId, recipientId, thread.id, dto);
    return dto;
  }

  async getDirectConversations(userId: string): Promise<MessengerDmConversationDto[]> {
    return loadMessengerDmConversations(this.prisma, userId);
  }

  async search(userId: string, query: string): Promise<{ items: MessengerSearchResultDto[] }> {
    const q = query.trim();
    if (q.length < 2) return { items: [] };
    const [channels, dms] = await Promise.all([
      this.prisma.messengerChannelMessage.findMany({
        where: { content: { contains: q, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: SEARCH_PAGE_SIZE,
      }),
      this.prisma.messengerDirectMessage.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          thread: { OR: [{ participantAId: userId }, { participantBId: userId }] },
        },
        include: { thread: true },
        orderBy: { createdAt: 'desc' },
        take: SEARCH_PAGE_SIZE,
      }),
    ]);
    const items: MessengerSearchResultDto[] = [
      ...channels.map((m) => ({
        scope: 'channel' as const,
        channelId: m.channelId,
        recipientId: null,
        messageId: m.id,
        senderName: m.senderNameSnapshot,
        content: m.content,
        createdAt: m.createdAt,
      })),
      ...dms.map((m) => ({
        scope: 'dm' as const,
        channelId: m.threadId,
        recipientId:
          m.thread.participantAId === userId ? m.thread.participantBId : m.thread.participantAId,
        messageId: m.id,
        senderName: m.senderNameSnapshot,
        content: m.content,
        createdAt: m.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: items.slice(0, SEARCH_PAGE_SIZE) };
  }

  async markChannelRead(channelId: string, employeeId: string): Promise<void> {
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const lastReadAt = await markChannelReadForEmployee(this.prisma, channelId, employeeId);
    this.messengerGateway.emitReadListsUpdated(employeeId);
    this.messengerGateway.emitChannelPeerRead(channelId, {
      channelId,
      readerId: employeeId,
      lastReadAt: lastReadAt.toISOString(),
    });
  }

  async markDirectConversationRead(actorId: string, recipientId: string): Promise<void> {
    const [a, b] = orderedParticipantIds(actorId, recipientId);
    const thread = await this.prisma.messengerDirectThread.findUnique({
      where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
    });
    if (!thread) return;
    const lastReadAt = await markDmThreadReadForEmployee(this.prisma, thread.id, actorId);
    this.messengerGateway.emitReadListsUpdated(actorId);
    this.messengerGateway.emitDmPeerRead(recipientId, {
      counterpartId: actorId,
      threadId: thread.id,
      lastReadAt: lastReadAt.toISOString(),
    });
  }
}
