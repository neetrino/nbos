import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@nbos/database';
import { NotificationService } from './notification.service';

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

type CreateArgs = {
  data: {
    recipientEmployeeId: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    actionLabel?: string | null;
    category?: string;
    priority?: string;
    entityType: string | null;
    entityId: string | null;
  };
};

type WhereInput = Partial<InAppNotificationRow>;

type NotificationJobRow = { id: string; dedupeKey: string };
type NotificationRuleRow = {
  id: string;
  code: string;
  eventType: string;
  recipientResolver: string;
  channels: string[];
  priority: string;
  enabled: boolean;
};
type NotificationEventRow = { id: string; idempotencyKey: string };

function matchesWhere(row: InAppNotificationRow, where: WhereInput): boolean {
  return Object.entries(where).every(([key, value]) => {
    return row[key as keyof InAppNotificationRow] === value;
  });
}

function buildInMemoryPrisma() {
  const rows: InAppNotificationRow[] = [];
  const jobs: NotificationJobRow[] = [];
  const rules: NotificationRuleRow[] = [];
  const events: NotificationEventRow[] = [];

  const toRow = (data: CreateArgs['data']): InAppNotificationRow => ({
    id: randomUUID(),
    recipientEmployeeId: data.recipientEmployeeId,
    type: data.type,
    category: data.category ?? 'informational',
    priority: data.priority ?? 'normal',
    title: data.title,
    body: data.body,
    link: data.link,
    actionLabel: data.actionLabel ?? null,
    entityType: data.entityType,
    entityId: data.entityId,
    isRead: false,
    readAt: null,
    archivedAt: null,
    createdAt: new Date(1_000_000 + rows.length),
  });

  const prisma: Record<string, unknown> = {
    $transaction: async <T>(fn: (tx: Record<string, unknown>) => Promise<T>) => fn(prisma),
    notificationJob: {
      findUnique: async ({ where }: { where: { dedupeKey: string } }) =>
        jobs.find((job) => job.dedupeKey === where.dedupeKey) ?? null,
      create: async ({ data }: { data: { dedupeKey: string } }) => {
        const row = { id: randomUUID(), dedupeKey: data.dedupeKey };
        jobs.push(row);
        return row;
      },
    },
    notificationRule: {
      findUnique: async ({ where }: { where: { code: string } }) =>
        rules.find((rule) => rule.code === where.code) ?? null,
      findMany: async ({ where }: { where?: { code?: { startsWith: string } } }) => {
        if (where?.code?.startsWith) {
          return rules.filter((rule) => rule.code.startsWith(where.code!.startsWith));
        }
        return [...rules];
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { code: string };
        create?: Partial<NotificationRuleRow>;
        update?: Partial<NotificationRuleRow>;
      }) => {
        const existing = rules.find((rule) => rule.code === where.code);
        if (existing) {
          const next = { ...existing, ...(update ?? {}) };
          const idx = rules.findIndex((r) => r.code === where.code);
          rules[idx] = next;
          return next;
        }
        const row: NotificationRuleRow = {
          id: randomUUID(),
          code: where.code,
          eventType: create?.eventType ?? 'unknown',
          recipientResolver: create?.recipientResolver ?? 'EXPLICIT_RECIPIENT',
          channels: create?.channels ?? ['IN_APP'],
          priority: create?.priority ?? 'normal',
          enabled: create?.enabled ?? true,
        };
        rules.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { code: string };
        data: Partial<NotificationRuleRow>;
      }) => {
        const idx = rules.findIndex((rule) => rule.code === where.code);
        if (idx < 0) throw new Error('not found');
        const next = { ...rules[idx]!, ...data };
        rules[idx] = next;
        return next;
      },
    },
    notificationEvent: {
      upsert: async ({ where }: { where: { idempotencyKey: string } }) => {
        const existing = events.find((event) => event.idempotencyKey === where.idempotencyKey);
        if (existing) return existing;
        const row = { id: randomUUID(), idempotencyKey: where.idempotencyKey };
        events.push(row);
        return row;
      },
    },
    notificationDelivery: {
      create: async () => ({ id: randomUUID() }),
    },
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
        where: { recipientEmployeeId: string; category?: string; archivedAt?: null };
        orderBy: { createdAt: 'desc' };
        skip: number;
        take: number;
      }) => {
        const list = rows
          .filter((r) => matchesWhere(r, where))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return list.slice(skip, skip + take);
      },
      count: async ({
        where,
      }: {
        where: {
          recipientEmployeeId: string;
          isRead?: boolean;
          archivedAt?: null;
          category?: string;
        };
      }) =>
        rows.filter((r) => {
          if (r.recipientEmployeeId !== where.recipientEmployeeId) return false;
          if ('isRead' in where && where.isRead === false && r.isRead) return false;
          if ('archivedAt' in where && r.archivedAt !== where.archivedAt) return false;
          if (where.category && r.category !== where.category) return false;
          return true;
        }).length,
      findFirst: async ({ where }: { where: WhereInput }) =>
        rows.find((r) => matchesWhere(r, where)) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { isRead: boolean; readAt: Date; archivedAt?: Date };
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
        where: { recipientEmployeeId: string; isRead: boolean; archivedAt?: null };
        data: { isRead: boolean; readAt: Date };
      }) => {
        let n = 0;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]!;
          if (
            r.recipientEmployeeId === where.recipientEmployeeId &&
            r.isRead === where.isRead &&
            (!('archivedAt' in where) || r.archivedAt === where.archivedAt)
          ) {
            rows[i] = { ...r, ...data };
            n++;
          }
        }
        return { count: n };
      },
    },
  };

  return { prisma: prisma as unknown as InstanceType<typeof PrismaClient> };
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

    it('skips in-app delivery when user preference disables event type', async () => {
      await service.updateUserPreference('u1', 'info', { enabled: false, channels: ['IN_APP'] });

      const result = await service.create({
        type: 'info',
        recipientId: 'u1',
        title: 'T',
        body: 'B',
      });

      expect(result.id.startsWith('skipped:')).toBe(true);
      expect(result.isRead).toBe(true);
    });
  });

  describe('preferences', () => {
    it('returns defaults and persists channel overrides', async () => {
      const list = await service.getUserPreferences('u1');
      expect(list.length).toBeGreaterThan(0);

      const updated = await service.updateUserPreference('u1', 'task.overdue', {
        enabled: true,
        channels: ['IN_APP', 'EMAIL'],
      });
      expect(updated.channels).toContain('EMAIL');
    });
  });

  describe('admin rules', () => {
    it('lists only admin-managed rules (without user_pref overrides)', async () => {
      await service.updateUserPreference('u1', 'task.overdue', { enabled: false });
      await service.create({ type: 'task.overdue', recipientId: 'u2', title: 'A', body: 'B' });

      const rows = await service.listAdminRules();
      expect(rows.some((row) => row.code.startsWith('user_pref:'))).toBe(false);
    });

    it('patches admin-managed rule priority and channels', async () => {
      await service.create({ type: 'task.overdue', recipientId: 'u2', title: 'A', body: 'B' });
      const rules = await service.listAdminRules();
      const target = rules.find((row) => row.eventType === 'task.overdue');
      expect(target).toBeTruthy();

      const patched = await service.patchAdminRule(target!.code, {
        priority: 'critical',
        channels: ['IN_APP', 'EMAIL'],
      });
      expect(patched.priority).toBe('critical');
      expect(patched.channels).toContain('EMAIL');
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
