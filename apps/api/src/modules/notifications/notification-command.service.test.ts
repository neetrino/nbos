import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NotificationCommandService } from './notification-command.service';
import { mapWithConcurrency } from './map-with-concurrency';

describe('mapWithConcurrency', () => {
  it('respects concurrency bound', async () => {
    let active = 0;
    let maxActive = 0;
    const items = [1, 2, 3, 4, 5, 6];
    await mapWithConcurrency(items, 2, async (n) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return n * 2;
    });
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

describe('NotificationCommandService', () => {
  const prevV2 = process.env.NOTIFICATION_COMMAND_V2_ENABLED;
  const prevBulk = process.env.NOTIFICATION_BULK_WRITE_ENABLED;
  const prevWrite = process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED;
  const prevSse = process.env.NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED;

  beforeEach(() => {
    process.env.NOTIFICATION_COMMAND_V2_ENABLED = 'true';
    process.env.NOTIFICATION_BULK_WRITE_ENABLED = 'false';
    process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED = 'true';
    process.env.NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED = 'true';
  });

  afterEach(() => {
    restore('NOTIFICATION_COMMAND_V2_ENABLED', prevV2);
    restore('NOTIFICATION_BULK_WRITE_ENABLED', prevBulk);
    restore('NOTIFICATION_INBOX_STATE_WRITE_ENABLED', prevWrite);
    restore('NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED', prevSse);
  });

  it('createOne inserts once and skips duplicate unread bump', async () => {
    let inboxBumps = 0;
    const jobs = new Map<string, { id: string }>();
    const notifications: Array<{ id: string; title: string }> = [];

    const prisma = {
      $queryRaw: vi.fn(async () => {
        inboxBumps += 1;
        return [{ unread_count: inboxBumps, version: BigInt(inboxBumps) }];
      }),
      $transaction: async <T>(fn: (tx: typeof prisma) => Promise<T>) => fn(prisma),
      notificationRule: {
        findUnique: async () => null,
      },
      notificationJob: {
        findUnique: async ({ where }: { where: { dedupeKey: string } }) =>
          jobs.get(where.dedupeKey) ?? null,
        create: async ({ data }: { data: { dedupeKey: string } }) => {
          if (jobs.has(data.dedupeKey)) throw new Error('unique');
          const row = { id: `job-${jobs.size + 1}` };
          jobs.set(data.dedupeKey, row);
          return row;
        },
      },
      notificationEvent: {
        upsert: async () => ({ id: 'ev-1' }),
      },
      notificationDelivery: {
        create: async () => ({ id: 'd-1' }),
      },
      inAppNotification: {
        findFirst: async () =>
          notifications[0]
            ? {
                id: notifications[0].id,
                recipientEmployeeId: 'u1',
                type: 'info',
                category: 'informational',
                priority: 'normal',
                title: notifications[0].title,
                body: 'b',
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
        create: async ({ data }: { data: { title: string } }) => {
          const row = {
            id: `n-${notifications.length + 1}`,
            recipientEmployeeId: 'u1',
            type: 'info',
            category: 'informational',
            priority: 'normal',
            title: data.title,
            body: 'b',
            link: null,
            actionLabel: null,
            entityType: null,
            entityId: null,
            isRead: false,
            readAt: null,
            archivedAt: null,
            createdAt: new Date(),
          };
          notifications.push({ id: row.id, title: data.title });
          return row;
        },
      },
    };

    const ruleCache = {
      getOrCreateRuleId: async () => 'rule-1',
    };
    const publisher = {
      publishSnapshot: vi.fn(async () => null),
      publishUnreadState: vi.fn(async () => null),
    };

    const service = new NotificationCommandService(
      prisma as never,
      ruleCache as never,
      publisher as never,
    );

    const first = await service.createOne({
      type: 'info',
      recipientId: 'u1',
      title: 'Hello',
      body: 'b',
      dedupeKey: 'k1',
      idempotencyKey: 'k1',
    });
    expect(first.id).toBe('n-1');
    expect(inboxBumps).toBe(1);
    expect(publisher.publishSnapshot).toHaveBeenCalledTimes(1);

    const second = await service.createOne({
      type: 'info',
      recipientId: 'u1',
      title: 'Hello',
      body: 'b',
      dedupeKey: 'k1',
      idempotencyKey: 'k1',
    });
    expect(second.id).toBe('n-1');
    expect(inboxBumps).toBe(1);
    expect(publisher.publishSnapshot).toHaveBeenCalledTimes(1);
  });

  it('skips recipient when preference disables IN_APP', async () => {
    const prisma = {
      notificationRule: {
        findUnique: async () => ({ enabled: false, channels: ['IN_APP'] }),
      },
      $transaction: vi.fn(),
    };
    const service = new NotificationCommandService(
      prisma as never,
      { getOrCreateRuleId: async () => 'rule-1' } as never,
    );
    const row = await service.createOne({
      type: 'info',
      recipientId: 'u1',
      title: 'T',
      body: 'B',
    });
    expect(row.id.startsWith('skipped:')).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('createMany loads preferences in one query when bulk enabled', async () => {
    process.env.NOTIFICATION_BULK_WRITE_ENABLED = 'true';
    const findManyPrefs = vi.fn(async () => []);
    const findManyJobs = vi.fn(async () => []);
    let queryStep = 0;
    const executeRaw = vi.fn(async () => 0);
    const queryRaw = vi.fn(async () => {
      queryStep += 1;
      if (queryStep === 1) {
        return [
          { id: 'job-a', dedupe_key: 'bulk:u1' },
          { id: 'job-b', dedupe_key: 'bulk:u2' },
        ];
      }
      if (queryStep === 2) {
        return [rowFor('u1'), rowFor('u2')];
      }
      return [
        { employee_id: 'u1', unread_count: 1, version: 1n },
        { employee_id: 'u2', unread_count: 1, version: 1n },
      ];
    });

    const prisma = {
      notificationRule: { findMany: findManyPrefs },
      notificationJob: { findMany: findManyJobs },
      notificationEvent: {
        findMany: async () => [
          { id: 'e1', idempotencyKey: 'bulk:u1' },
          { id: 'e2', idempotencyKey: 'bulk:u2' },
        ],
      },
      $executeRaw: executeRaw,
      $queryRaw: queryRaw,
      $transaction: async <T>(fn: (tx: typeof prisma) => Promise<T>) => fn(prisma),
    };

    const publisher = {
      publishSnapshot: vi.fn(async () => null),
      publishUnreadState: vi.fn(async () => null),
    };

    const service = new NotificationCommandService(
      prisma as never,
      { getOrCreateRuleId: async () => 'rule-1' } as never,
      publisher as never,
    );

    const result = await service.createMany({
      recipientIds: ['u1', 'u2'],
      type: 'support.sla.resolve_warning',
      title: 'SLA',
      body: 'due',
      dedupeKeyPrefix: 'bulk',
    });

    expect(findManyPrefs).toHaveBeenCalledTimes(1);
    expect(result.inserted).toBe(2);
    expect(publisher.publishSnapshot).toHaveBeenCalledTimes(2);
  });
});

function rowFor(recipientId: string) {
  return {
    id: `n-${recipientId}`,
    recipientEmployeeId: recipientId,
    type: 'support.sla.resolve_warning',
    category: 'action_required',
    priority: 'high',
    title: 'SLA',
    body: 'due',
    link: null,
    actionLabel: null,
    entityType: null,
    entityId: null,
    isRead: false,
    readAt: null,
    archivedAt: null,
    createdAt: new Date(),
  };
}

function restore(key: string, prev: string | undefined): void {
  if (prev === undefined) delete process.env[key];
  else process.env[key] = prev;
}
