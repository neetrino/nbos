import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isNotificationInboxStateReconcileEnabled } from './notification-inbox-state.flags';
import { NotificationRealtimePublisher } from '../realtime/notification-realtime.publisher';

const DEFAULT_BATCH = 200;

export interface InboxReconcileResult {
  scanned: number;
  repaired: number;
  mismatches: Array<{
    employeeId: string;
    actual: number;
    stored: number;
    delta: number;
  }>;
}

/**
 * Compares COUNT(unread) vs NotificationInboxState and repairs drift in batches.
 * Enable with NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED=true.
 */
@Injectable()
export class NotificationInboxReconcileService {
  private readonly logger = new Logger(NotificationInboxReconcileService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly realtimePublisher: NotificationRealtimePublisher,
  ) {}

  async reconcileAll(options?: {
    batchSize?: number;
    publish?: boolean;
  }): Promise<InboxReconcileResult> {
    if (!isNotificationInboxStateReconcileEnabled()) {
      this.logger.warn('Inbox reconcile skipped (NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED off)');
      return { scanned: 0, repaired: 0, mismatches: [] };
    }

    const batchSize = options?.batchSize ?? DEFAULT_BATCH;
    const publish = options?.publish ?? true;
    let cursor: string | undefined;
    let scanned = 0;
    let repaired = 0;
    const mismatches: InboxReconcileResult['mismatches'] = [];

    for (;;) {
      const employees = await this.prisma.employee.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
        take: batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (employees.length === 0) break;

      for (const employee of employees) {
        scanned += 1;
        const actual = await this.prisma.inAppNotification.count({
          where: {
            recipientEmployeeId: employee.id,
            isRead: false,
            archivedAt: null,
          },
        });
        const storedRow = await this.prisma.notificationInboxState.findUnique({
          where: { employeeId: employee.id },
          select: { unreadCount: true, version: true },
        });
        const stored = storedRow?.unreadCount ?? null;
        if (stored === actual) continue;

        const delta = actual - (stored ?? 0);
        mismatches.push({
          employeeId: employee.id,
          actual,
          stored: stored ?? -1,
          delta,
        });

        const updated = await this.prisma.$queryRaw<
          Array<{ unread_count: number; version: bigint }>
        >`
          INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
          VALUES (${employee.id}, ${actual}, 1, CURRENT_TIMESTAMP)
          ON CONFLICT (employee_id) DO UPDATE
          SET
            unread_count = ${actual},
            version = notification_inbox_state.version + 1,
            updated_at = CURRENT_TIMESTAMP
          RETURNING unread_count, version
        `;
        repaired += 1;
        const row = updated[0];
        if (publish && row) {
          await this.realtimePublisher.publishSnapshot(
            employee.id,
            { unreadCount: Number(row.unread_count), version: Number(row.version) },
            { invalidateList: true },
          );
        }
      }

      cursor = employees[employees.length - 1]?.id;
      if (employees.length < batchSize) break;
    }

    this.logger.log(
      `Inbox reconcile complete: scanned=${scanned}, repaired=${repaired}, mismatches=${mismatches.length}`,
    );
    return { scanned, repaired, mismatches };
  }
}
