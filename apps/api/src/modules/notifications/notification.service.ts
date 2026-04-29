import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

/** Scalar shape returned by Prisma for `in_app_notifications` rows (no relations). */
type InAppNotificationRow = {
  id: string;
  recipientEmployeeId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export interface CreateNotificationParams {
  type: string;
  recipientId: string;
  title: string;
  body: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

export interface NotificationRow {
  id: string;
  type: string;
  recipientId: string;
  title: string;
  body: string;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

function toNotificationRow(row: InAppNotificationRow): NotificationRow {
  return {
    id: row.id,
    type: row.type,
    recipientId: row.recipientEmployeeId,
    title: row.title,
    body: row.body,
    link: row.link,
    entityType: row.entityType,
    entityId: row.entityId,
    isRead: row.isRead,
    createdAt: row.createdAt,
    readAt: row.readAt,
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(params: CreateNotificationParams): Promise<NotificationRow> {
    const row = await this.prisma.inAppNotification.create({
      data: {
        recipientEmployeeId: params.recipientId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
      },
    });
    this.logger.log(`Notification created for user ${params.recipientId}: ${params.title}`);
    return toNotificationRow(row);
  }

  async findByUser(userId: string, pagination: PaginationParams = {}) {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const where = { recipientEmployeeId: userId };
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
      },
    });
    return { count };
  }
}
