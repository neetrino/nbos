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
  MessengerDmConversationDto,
  MessengerDmPagedMessagesDto,
  MessengerMessageDto,
} from './messenger.types';

export type {
  MessengerChannelDto,
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

  async getMessages(channelId: string, pagination: PaginationParams = {}) {
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return {
        items: [] as MessengerMessageDto[],
        meta: {
          total: 0,
          page: DEFAULT_PAGE,
          pageSize: DEFAULT_PAGE_SIZE,
          totalPages: 1,
        },
      };
    }
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const skip = (page - 1) * pageSize;
    const [total, rows] = await Promise.all([
      this.prisma.messengerChannelMessage.count({ where: { channelId } }),
      this.prisma.messengerChannelMessage.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((m) => mapPrismaChannelMessageToDto(m)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async sendMessage(
    channelId: string,
    senderId: string,
    _senderNameFromJwt: string,
    content: string,
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
      },
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
      },
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

  async markChannelRead(channelId: string, employeeId: string): Promise<void> {
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    await markChannelReadForEmployee(this.prisma, channelId, employeeId);
    this.messengerGateway.emitReadListsUpdated(employeeId);
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
