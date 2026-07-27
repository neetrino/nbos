import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService inbox dual-write', () => {
  const prevWrite = process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED;

  beforeEach(() => {
    process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED = 'true';
  });

  afterEach(() => {
    if (prevWrite === undefined) delete process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED;
    else process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED = prevWrite;
  });

  it('increments inbox once on create and not on duplicate', async () => {
    let inboxCount = 0;
    const queryRaw = vi.fn(async () => {
      inboxCount += 1;
      return [{ unread_count: inboxCount, version: BigInt(inboxCount) }];
    });

    const notifications: Array<{ id: string; dedupeKey?: string }> = [];
    const prisma = {
      $queryRaw: queryRaw,
      $transaction: async <T>(fn: (tx: typeof prisma) => Promise<T>) => fn(prisma),
      notificationRule: {
        findUnique: async () => null,
        upsert: async () => ({ id: 'rule-1' }),
      },
      notificationJob: {
        findUnique: async ({ where }: { where: { dedupeKey: string } }) =>
          notifications.find((n) => n.dedupeKey === where.dedupeKey)
            ? { id: 'job-1', dedupeKey: where.dedupeKey }
            : null,
        create: async ({ data }: { data: { dedupeKey: string } }) => {
          notifications.push({ id: 'n1', dedupeKey: data.dedupeKey });
          return { id: 'job-1', dedupeKey: data.dedupeKey };
        },
      },
      notificationEvent: {
        upsert: async () => ({ id: 'ev-1' }),
      },
      notificationDelivery: {
        create: async () => ({ id: 'del-1' }),
      },
      inAppNotification: {
        findFirst: async () =>
          notifications.length
            ? {
                id: 'n1',
                recipientEmployeeId: 'u1',
                type: 'x',
                category: 'informational',
                priority: 'normal',
                title: 'T',
                body: '',
                link: null,
                actionLabel: null,
                entityType: null,
                entityId: null,
                isRead: false,
                readAt: null,
                archivedAt: null,
                createdAt: new Date(),
              }
            : null,
        create: async ({ data }: { data: { title: string } }) => ({
          id: 'n1',
          recipientEmployeeId: 'u1',
          type: 'x',
          category: 'informational',
          priority: 'normal',
          title: data.title,
          body: '',
          link: null,
          actionLabel: null,
          entityType: null,
          entityId: null,
          isRead: false,
          readAt: null,
          archivedAt: null,
          createdAt: new Date(),
        }),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const publisher = {
      publishSnapshot: vi.fn(async () => null),
      publishUnreadState: vi.fn(async () => null),
    };

    const service = new NotificationService(prisma as never, publisher as never);
    await service.create({ type: 'x', recipientId: 'u1', title: 'T', body: '' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(publisher.publishSnapshot).toHaveBeenCalledTimes(1);

    await service.create({ type: 'x', recipientId: 'u1', title: 'T', body: '' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(publisher.publishSnapshot).toHaveBeenCalledTimes(1);
  });

  it('mark read decrements once; second mark does not', async () => {
    process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED = 'true';
    let isRead = false;
    let unread = 1;
    const queryRaw = vi.fn(async () => {
      unread = Math.max(0, unread - 1);
      return [{ unread_count: unread, version: BigInt(2) }];
    });
    const row = () => ({
      id: 'n1',
      recipientEmployeeId: 'u1',
      type: 'x',
      category: 'informational',
      priority: 'normal',
      title: 'T',
      body: '',
      link: null,
      actionLabel: null,
      entityType: null,
      entityId: null,
      isRead,
      readAt: isRead ? new Date() : null,
      archivedAt: null,
      createdAt: new Date(),
    });

    const prisma = {
      $queryRaw: queryRaw,
      $transaction: async <T>(fn: (tx: typeof prisma) => Promise<T>) => fn(prisma),
      inAppNotification: {
        findFirst: async () => row(),
        update: async () => {
          isRead = true;
          return row();
        },
      },
    };
    const publisher = {
      publishSnapshot: vi.fn(async () => null),
      publishUnreadState: vi.fn(async () => null),
    };
    const service = new NotificationService(prisma as never, publisher as never);
    await service.markAsRead('n1', 'u1');
    expect(queryRaw).toHaveBeenCalledTimes(1);
    await service.markAsRead('n1', 'u1');
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
