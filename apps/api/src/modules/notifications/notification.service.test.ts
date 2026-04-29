import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@nbos/database';

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
import { NotificationService } from './notification.service';

type CreateArgs = {
  data: {
    recipientEmployeeId: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    entityType: string | null;
    entityId: string | null;
  };
};

function buildInMemoryPrisma() {
  const rows: InAppNotificationRow[] = [];

  const toRow = (data: CreateArgs['data']): InAppNotificationRow => ({
    id: randomUUID(),
    recipientEmployeeId: data.recipientEmployeeId,
    type: data.type,
    title: data.title,
    body: data.body,
    link: data.link,
    entityType: data.entityType,
    entityId: data.entityId,
    isRead: false,
    readAt: null,
    createdAt: new Date(1_000_000 + rows.length),
  });

  const prisma = {
    inAppNotification: {
      create: async ({ data }: CreateArgs) => {
        const row = toRow(data);
        rows.push(row);
        return row;
      },
      findMany: async ({
        where,
        orderBy: _orderBy,
        skip,
        take,
      }: {
        where: { recipientEmployeeId: string };
        orderBy: { createdAt: 'desc' };
        skip: number;
        take: number;
      }) => {
        const list = rows
          .filter((r) => r.recipientEmployeeId === where.recipientEmployeeId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return list.slice(skip, skip + take);
      },
      count: async ({ where }: { where: { recipientEmployeeId: string; isRead?: boolean } }) =>
        rows.filter((r) => {
          if (r.recipientEmployeeId !== where.recipientEmployeeId) return false;
          if ('isRead' in where && where.isRead === false && r.isRead) return false;
          return true;
        }).length,
      findFirst: async ({ where }: { where: { id: string; recipientEmployeeId: string } }) =>
        rows.find(
          (r) => r.id === where.id && r.recipientEmployeeId === where.recipientEmployeeId,
        ) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { isRead: boolean; readAt: Date };
      }) => {
        const idx = rows.findIndex((r) => r.id === where.id);
        if (idx < 0) throw new Error('not found');
        const prev = rows[idx]!;
        const next = { ...prev, ...data };
        rows[idx] = next;
        return next;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { recipientEmployeeId: string; isRead: boolean };
        data: { isRead: boolean; readAt: Date };
      }) => {
        let n = 0;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]!;
          if (r.recipientEmployeeId === where.recipientEmployeeId && r.isRead === where.isRead) {
            rows[i] = { ...r, ...data };
            n++;
          }
        }
        return { count: n };
      },
    },
  } as unknown as InstanceType<typeof PrismaClient>;

  return { prisma };
}

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: InstanceType<typeof PrismaClient>;

  beforeEach(() => {
    prisma = buildInMemoryPrisma().prisma;
    service = new NotificationService(prisma);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const result = await service.create({
        type: 'info',
        recipientId: 'user-1',
        title: 'Test',
        body: 'Test body',
      });

      expect(result.id).toBeDefined();
      expect(result.recipientId).toBe('user-1');
      expect(result.title).toBe('Test');
      expect(result.isRead).toBe(false);
    });

    it('should order newest first in findByUser', async () => {
      await service.create({ type: 'a', recipientId: 'u1', title: 'First', body: '' });
      await service.create({ type: 'b', recipientId: 'u1', title: 'Second', body: '' });

      const result = await service.findByUser('u1');
      expect(result.items[0]!.title).toBe('Second');
      expect(result.items[1]!.title).toBe('First');
    });

    it('should set optional fields to null when not provided', async () => {
      const result = await service.create({
        type: 'info',
        recipientId: 'u1',
        title: 'T',
        body: 'B',
      });

      expect(result.link).toBeNull();
      expect(result.entityType).toBeNull();
      expect(result.entityId).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return empty for unknown user', async () => {
      const result = await service.findByUser('unknown');
      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should paginate results', async () => {
      for (let i = 0; i < 25; i++) {
        await service.create({ type: 'x', recipientId: 'u1', title: `N${i}`, body: '' });
      }

      const page1 = await service.findByUser('u1', { page: 1, pageSize: 10 });
      const page2 = await service.findByUser('u1', { page: 2, pageSize: 10 });
      const page3 = await service.findByUser('u1', { page: 3, pageSize: 10 });

      expect(page1.items.length).toBe(10);
      expect(page2.items.length).toBe(10);
      expect(page3.items.length).toBe(5);
      expect(page1.meta.totalPages).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const created = await service.create({ type: 'x', recipientId: 'u1', title: 'T', body: '' });
      expect(created.isRead).toBe(false);

      const updated = await service.markAsRead(created.id, 'u1');
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException for missing notification', async () => {
      await expect(service.markAsRead('bad-id', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      await service.create({ type: 'x', recipientId: 'u1', title: 'T1', body: '' });
      await service.create({ type: 'x', recipientId: 'u1', title: 'T2', body: '' });
      await service.create({ type: 'x', recipientId: 'u1', title: 'T3', body: '' });

      const result = await service.markAllAsRead('u1');
      expect(result.updated).toBe(3);

      const count = await service.getUnreadCount('u1');
      expect(count.count).toBe(0);
    });

    it('should skip already-read notifications', async () => {
      const n = await service.create({ type: 'x', recipientId: 'u1', title: 'T1', body: '' });
      await service.markAsRead(n.id, 'u1');
      await service.create({ type: 'x', recipientId: 'u1', title: 'T2', body: '' });

      const result = await service.markAllAsRead('u1');
      expect(result.updated).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 for unknown user', async () => {
      expect(await service.getUnreadCount('unknown')).toEqual({ count: 0 });
    });

    it('should count only unread notifications', async () => {
      await service.create({ type: 'x', recipientId: 'u1', title: 'T1', body: '' });
      const n2 = await service.create({ type: 'x', recipientId: 'u1', title: 'T2', body: '' });
      await service.create({ type: 'x', recipientId: 'u1', title: 'T3', body: '' });

      await service.markAsRead(n2.id, 'u1');

      expect(await service.getUnreadCount('u1')).toEqual({ count: 2 });
    });
  });
});
