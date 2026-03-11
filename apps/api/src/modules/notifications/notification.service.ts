import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * MVP: in-memory store.
 * TODO: migrate to Prisma model or Redis when Notification table is added to schema.
 */

interface CreateNotificationParams {
  type: string;
  recipientId: string;
  title: string;
  body: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

interface Notification {
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

@Injectable()
export class NotificationService {
  private readonly store = new Map<string, Notification[]>();
  private readonly logger = new Logger(NotificationService.name);

  create(params: CreateNotificationParams): Notification {
    const notification: Notification = {
      id: randomUUID(),
      type: params.type,
      recipientId: params.recipientId,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      isRead: false,
      createdAt: new Date(),
      readAt: null,
    };

    const existing = this.store.get(params.recipientId) ?? [];
    existing.unshift(notification);
    this.store.set(params.recipientId, existing);

    this.logger.log(`Notification created for user ${params.recipientId}: ${params.title}`);
    return notification;
  }

  findByUser(userId: string, pagination: PaginationParams = {}) {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const all = this.store.get(userId) ?? [];
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  markAsRead(id: string, userId: string): Notification {
    const notification = this.findOneByUser(id, userId);
    notification.isRead = true;
    notification.readAt = new Date();
    return notification;
  }

  markAllAsRead(userId: string): { updated: number } {
    const all = this.store.get(userId) ?? [];
    let updated = 0;

    for (const n of all) {
      if (!n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        updated++;
      }
    }

    return { updated };
  }

  getUnreadCount(userId: string): { count: number } {
    const all = this.store.get(userId) ?? [];
    const count = all.filter((n) => !n.isRead).length;
    return { count };
  }

  private findOneByUser(id: string, userId: string): Notification {
    const all = this.store.get(userId) ?? [];
    const notification = all.find((n) => n.id === id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }
}
