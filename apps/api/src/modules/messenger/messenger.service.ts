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

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

export interface MessengerChannelDto {
  id: string;
  name: string;
  projectId: string;
  type: MessengerChannelTypeApi;
  createdAt: Date;
}

export interface MessengerMessageDto {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
}

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async getChannels(): Promise<MessengerChannelDto[]> {
    const rows = await this.prisma.messengerChannel.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      projectId: r.projectId,
      type: channelTypeToApi(r.type),
      createdAt: r.createdAt,
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
      items: rows.map((m) => this.mapChannelMessage(m)),
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
    const snapshot = await this.snapshotSenderName(senderId);
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
    return this.mapChannelMessage(created);
  }

  async getDirectMessages(userId1: string, userId2: string, pagination: PaginationParams = {}) {
    const [a, b] = orderedParticipantIds(userId1, userId2);
    const thread = await this.prisma.messengerDirectThread.findUnique({
      where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
    });
    if (!thread) {
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
    const where = { threadId: thread.id };
    const [total, rows] = await Promise.all([
      this.prisma.messengerDirectMessage.count({ where }),
      this.prisma.messengerDirectMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((m) => this.mapDmMessage(m, thread.id)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
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
    const snapshot = await this.snapshotSenderName(senderId);
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
    return this.mapDmMessage(created, thread.id);
  }

  async getDirectConversations(
    userId: string,
  ): Promise<{ recipientId: string; lastMessage: MessengerMessageDto }[]> {
    const threads = await this.prisma.messengerDirectThread.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    const result: { recipientId: string; lastMessage: MessengerMessageDto }[] = [];
    for (const t of threads) {
      const last = t.messages[0];
      if (!last) continue;
      const recipientId = t.participantAId === userId ? t.participantBId : t.participantAId;
      result.push({
        recipientId,
        lastMessage: this.mapDmMessage(last, t.id),
      });
    }
    result.sort((x, y) => y.lastMessage.createdAt.getTime() - x.lastMessage.createdAt.getTime());
    return result;
  }

  private mapChannelMessage(m: {
    id: string;
    channelId: string;
    senderId: string;
    senderNameSnapshot: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
  }): MessengerMessageDto {
    return {
      id: m.id,
      channelId: m.channelId,
      senderId: m.senderId,
      senderName: m.senderNameSnapshot,
      content: m.content,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
    };
  }

  private mapDmMessage(
    m: {
      id: string;
      senderId: string;
      senderNameSnapshot: string;
      content: string;
      createdAt: Date;
      editedAt: Date | null;
    },
    threadId: string,
  ): MessengerMessageDto {
    return {
      id: m.id,
      channelId: threadId,
      senderId: m.senderId,
      senderName: m.senderNameSnapshot,
      content: m.content,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
    };
  }

  private async snapshotSenderName(senderId: string): Promise<string> {
    const emp = await this.prisma.employee.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true, email: true },
    });
    if (!emp) {
      throw new NotFoundException('Sender employee not found');
    }
    const full = `${emp.firstName} ${emp.lastName}`.trim();
    return full.length > 0 ? full : emp.email;
  }
}
