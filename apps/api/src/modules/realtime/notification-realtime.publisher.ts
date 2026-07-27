import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NOTIFICATION_SSE_EVENT } from './notification-realtime.constants';
import { NotificationRealtimeEventBus } from './notification-realtime-event-bus';
import type { NotificationUnreadChangedPayload } from './notification-realtime.types';

/**
 * Publishes notification realtime events **after** DB work has committed.
 * Call only from paths that have finished their transaction successfully.
 */
@Injectable()
export class NotificationRealtimePublisher {
  private readonly logger = new Logger(NotificationRealtimePublisher.name);
  /** Monotonic per-employee version until NotificationInboxState (Phase 2+). */
  private readonly versionByEmployee = new Map<string, number>();

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly eventBus: NotificationRealtimeEventBus,
  ) {}

  /**
   * Re-reads unread count and publishes one SSE bus message for an employee.
   * Hub expands `invalidateList` into unread + list.invalidate frames.
   */
  async publishUnreadState(
    employeeId: string,
    options?: { invalidateList?: boolean },
  ): Promise<NotificationUnreadChangedPayload | null> {
    try {
      const unreadCount = await this.prisma.inAppNotification.count({
        where: {
          recipientEmployeeId: employeeId,
          isRead: false,
          archivedAt: null,
        },
      });
      const version = this.nextVersion(employeeId);
      const invalidateList = options?.invalidateList ?? true;
      const payload: NotificationUnreadChangedPayload = {
        schemaVersion: 1,
        employeeId,
        unreadCount,
        version,
        occurredAt: new Date().toISOString(),
        invalidateList,
      };

      await this.eventBus.publish({
        event: invalidateList
          ? NOTIFICATION_SSE_EVENT.LIST_INVALIDATE
          : NOTIFICATION_SSE_EVENT.UNREAD_CHANGED,
        payload,
      });
      return payload;
    } catch (err) {
      this.logger.error(`Failed to publish unread state for ${employeeId}: ${String(err)}`);
      return null;
    }
  }

  /** One publish per unique employee (final unread state). */
  async publishUnreadStateForMany(
    employeeIds: readonly string[],
    options?: { invalidateList?: boolean },
  ): Promise<void> {
    const unique = [...new Set(employeeIds.filter(Boolean))];
    for (const employeeId of unique) {
      await this.publishUnreadState(employeeId, options);
    }
  }

  private nextVersion(employeeId: string): number {
    const next = (this.versionByEmployee.get(employeeId) ?? 0) + 1;
    this.versionByEmployee.set(employeeId, next);
    return next;
  }
}
