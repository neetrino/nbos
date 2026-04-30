import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { resolveNotificationRuleConfig } from './notification-rules';

type InAppNotificationRow = {
  id: string;
  recipientEmployeeId: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  link: string | null;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
};

export interface CreateNotificationParams {
  type: string;
  recipientId: string;
  title: string;
  body: string;
  link?: string;
  actionLabel?: string;
  category?: string;
  priority?: string;
  entityType?: string;
  entityId?: string;
  sourceModule?: string;
  idempotencyKey?: string;
  dedupeKey?: string;
  payload?: InputJsonValue;
}

export interface NotificationRow {
  id: string;
  type: string;
  recipientId: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  link: string | null;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
  archivedAt: Date | null;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  category?: string;
  includeArchived?: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DIRECT_IN_APP_RESOLVER = 'EXPLICIT_RECIPIENT';

function normalizePage(value: number | undefined): number {
  return value && value > 0 ? value : DEFAULT_PAGE;
}

function normalizePageSize(value: number | undefined): number {
  if (!value || value < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(value, DEFAULT_PAGE_SIZE);
}

function notificationFingerprint(params: CreateNotificationParams): string {
  const entity =
    params.entityType && params.entityId ? `${params.entityType}:${params.entityId}` : params.title;
  return [params.type, params.recipientId, entity].join(':');
}

function directRuleCode(eventType: string): string {
  return `in_app.${eventType}`;
}

function notificationWhere(params: CreateNotificationParams) {
  const base = {
    recipientEmployeeId: params.recipientId,
    type: params.type,
    title: params.title,
    body: params.body,
  };

  if (params.entityType && params.entityId) {
    return { ...base, entityType: params.entityType, entityId: params.entityId };
  }

  return base;
}

function toNotificationRow(row: InAppNotificationRow): NotificationRow {
  return {
    id: row.id,
    type: row.type,
    recipientId: row.recipientEmployeeId,
    category: row.category,
    priority: row.priority,
    title: row.title,
    body: row.body,
    link: row.link,
    actionLabel: row.actionLabel,
    entityType: row.entityType,
    entityId: row.entityId,
    isRead: row.isRead,
    createdAt: row.createdAt,
    readAt: row.readAt,
    archivedAt: row.archivedAt,
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(params: CreateNotificationParams): Promise<NotificationRow> {
    const ruleConfig = resolveNotificationRuleConfig(params.type);
    const priority = params.priority ?? ruleConfig.priority;
    const category = params.category ?? ruleConfig.category;

    const row = await this.prisma.$transaction(async (tx) => {
      const fingerprint = notificationFingerprint(params);
      const dedupeKey = params.dedupeKey ?? `in_app:${fingerprint}`;
      const idempotencyKey = params.idempotencyKey ?? `direct:${fingerprint}`;
      const existingJob = await tx.notificationJob.findUnique({ where: { dedupeKey } });
      if (existingJob) {
        const existing = await tx.inAppNotification.findFirst({
          where: notificationWhere(params),
          orderBy: { createdAt: 'desc' },
        });
        if (existing) return existing;
      }

      const rule = await tx.notificationRule.upsert({
        where: { code: directRuleCode(params.type) },
        update: { enabled: true, priority },
        create: {
          code: directRuleCode(params.type),
          eventType: params.type,
          recipientResolver: DIRECT_IN_APP_RESOLVER,
          priority,
        },
      });

      const event = await tx.notificationEvent.upsert({
        where: { idempotencyKey },
        update: {},
        create: {
          eventType: params.type,
          sourceModule: params.sourceModule ?? 'notifications',
          sourceEntityType: params.entityType ?? null,
          sourceEntityId: params.entityId ?? null,
          payload: params.payload,
          idempotencyKey,
        },
      });

      const job = await tx.notificationJob.create({
        data: {
          eventId: event.id,
          ruleId: rule.id,
          status: 'DELIVERED',
          processedAt: new Date(),
          dedupeKey,
        },
      });

      await tx.notificationDelivery.create({
        data: {
          jobId: job.id,
          channel: 'IN_APP',
          recipient: params.recipientId,
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      return tx.inAppNotification.create({
        data: {
          recipientEmployeeId: params.recipientId,
          type: params.type,
          category,
          priority,
          title: params.title,
          body: params.body,
          link: params.link ?? null,
          actionLabel: params.actionLabel ?? null,
          entityType: params.entityType ?? null,
          entityId: params.entityId ?? null,
        },
      });
    });

    this.logger.log(`Notification created for user ${params.recipientId}: ${params.title}`);
    return toNotificationRow(row);
  }

  async findByUser(userId: string, pagination: PaginationParams = {}) {
    const page = normalizePage(pagination.page);
    const pageSize = normalizePageSize(pagination.pageSize);
    const where = {
      recipientEmployeeId: userId,
      ...(pagination.category ? { category: pagination.category } : {}),
      ...(pagination.includeArchived ? {} : { archivedAt: null }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.inAppNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.inAppNotification.count({ where }),
    ]);

    return {
      items: rows.map(toNotificationRow),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async archive(id: string, userId: string): Promise<NotificationRow> {
    const owned = await this.prisma.inAppNotification.findFirst({
      where: { id, recipientEmployeeId: userId },
    });
    if (!owned) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    const now = new Date();
    const row = await this.prisma.inAppNotification.update({
      where: { id },
      data: {
        archivedAt: now,
        isRead: true,
        readAt: owned.readAt ?? now,
      },
    });
    return toNotificationRow(row);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationRow> {
    const owned = await this.prisma.inAppNotification.findFirst({
      where: { id, recipientEmployeeId: userId },
    });
    if (!owned) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    const row = await this.prisma.inAppNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return toNotificationRow(row);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.inAppNotification.updateMany({
      where: {
        recipientEmployeeId: userId,
        isRead: false,
        archivedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return { updated: result.count };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.inAppNotification.count({
      where: {
        recipientEmployeeId: userId,
        isRead: false,
        archivedAt: null,
      },
    });
    return { count };
  }
}
