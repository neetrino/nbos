import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { decodeNotificationCursor, encodeNotificationCursor } from './notification-list-cursor';
import { NotificationService } from './notification.service';

describe('notification-list-cursor', () => {
  it('round-trips createdAt + id', () => {
    const encoded = encodeNotificationCursor({
      createdAt: '2026-07-27T10:00:00.000Z',
      id: 'n-1',
    });
    expect(decodeNotificationCursor(encoded)).toEqual({
      createdAt: '2026-07-27T10:00:00.000Z',
      id: 'n-1',
    });
  });

  it('rejects garbage', () => {
    expect(decodeNotificationCursor('not-valid')).toBeNull();
    expect(
      decodeNotificationCursor(encodeNotificationCursor({ createdAt: 'x', id: '1' })),
    ).toBeNull();
  });
});

describe('NotificationService.findByUserCursor', () => {
  function row(partial: {
    id: string;
    recipientEmployeeId: string;
    createdAt: Date;
    archivedAt?: Date | null;
  }) {
    return {
      id: partial.id,
      recipientEmployeeId: partial.recipientEmployeeId,
      type: 'x',
      category: 'informational',
      priority: 'normal',
      title: partial.id,
      body: '',
      link: null,
      actionLabel: null,
      entityType: null,
      entityId: null,
      isRead: false,
      readAt: null,
      archivedAt: partial.archivedAt ?? null,
      createdAt: partial.createdAt,
    };
  }

  it('returns hasMore and nextCursor without calling count', async () => {
    const t0 = new Date('2026-07-27T12:00:00.000Z');
    const rows = [
      row({ id: 'a', recipientEmployeeId: 'u1', createdAt: new Date(t0.getTime()) }),
      row({ id: 'b', recipientEmployeeId: 'u1', createdAt: new Date(t0.getTime() - 1000) }),
      row({ id: 'c', recipientEmployeeId: 'u1', createdAt: new Date(t0.getTime() - 2000) }),
    ];
    const findMany = vi.fn(async ({ take }: { take: number }) => rows.slice(0, take));
    const count = vi.fn();
    const prisma = {
      inAppNotification: { findMany, count },
      notificationRule: { findUnique: vi.fn() },
      $transaction: vi.fn(),
    };
    const service = new NotificationService(prisma as never);
    const page1 = await service.findByUserCursor('u1', { limit: 2 });
    expect(count).not.toHaveBeenCalled();
    expect(page1.items).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();

    findMany.mockImplementation(async ({ where, take }) => {
      const cursor = where.AND?.[0]?.OR;
      expect(cursor).toBeDefined();
      return rows.slice(2, 2 + take);
    });
    const page2 = await service.findByUserCursor('u1', {
      limit: 2,
      cursor: page1.nextCursor ?? undefined,
    });
    expect(page2.items.map((i) => i.id)).toEqual(['c']);
    expect(page2.hasMore).toBe(false);
    expect(page2.nextCursor).toBeNull();
  });

  it('rejects invalid cursor', async () => {
    const prisma = {
      inAppNotification: { findMany: vi.fn(), count: vi.fn() },
    };
    const service = new NotificationService(prisma as never);
    await expect(service.findByUserCursor('u1', { cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('filters other employees and archived by default', async () => {
    const findMany = vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
      expect(where.recipientEmployeeId).toBe('u1');
      expect(where.archivedAt).toBeNull();
      return [];
    });
    const service = new NotificationService({
      inAppNotification: { findMany, count: vi.fn() },
    } as never);
    const empty = await service.findByUserCursor('u1', { limit: 20 });
    expect(empty.items).toEqual([]);
    expect(empty.hasMore).toBe(false);
  });
});
