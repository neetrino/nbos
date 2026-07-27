import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isNotificationInboxStateReconcileEnabled } from './notification-inbox-state.flags';
import { NotificationRealtimePublisher } from '../realtime/notification-realtime.publisher';
import { recordInboxMetric } from './notification-inbox-metrics';
import type { InboxDryRunReport } from './notification-inbox-readiness';

const DEFAULT_BATCH = 200;

export type InboxReconcileOptions = {
  batchSize?: number;
  limit?: number;
  employeeId?: string;
  mode?: 'dry-run' | 'repair';
  publish?: boolean;
  /** CLI / tests may bypass reconcile feature flag. */
  force?: boolean;
};

/**
 * Compares COUNT(unread) vs NotificationInboxState.
 * Repair uses per-employee advisory xact lock + re-count to avoid lost updates.
 */
@Injectable()
export class NotificationInboxReconcileService {
  private readonly logger = new Logger(NotificationInboxReconcileService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly realtimePublisher?: NotificationRealtimePublisher,
  ) {}

  async reconcileAll(options?: InboxReconcileOptions): Promise<InboxDryRunReport> {
    const mode = options?.mode ?? 'repair';
    if (!options?.force && !isNotificationInboxStateReconcileEnabled()) {
      this.logger.warn('Inbox reconcile skipped (NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED off)');
      return emptyReport(mode);
    }

    const batchSize = options?.batchSize ?? DEFAULT_BATCH;
    const limit = options?.limit;
    const publish = options?.publish ?? mode === 'repair';
    let cursor: string | undefined;
    let scanned = 0;
    let matched = 0;
    let drifted = 0;
    let missing = 0;
    let negative = 0;
    let maxAbsoluteDrift = 0;
    let repaired = 0;

    if (options?.employeeId) {
      const outcome = await this.processEmployee(options.employeeId, mode, publish);
      return {
        scanned: 1,
        matched: outcome.kind === 'matched' ? 1 : 0,
        drifted: outcome.kind === 'drifted' ? 1 : 0,
        missing: outcome.kind === 'missing' ? 1 : 0,
        negative: outcome.negative ? 1 : 0,
        maxAbsoluteDrift: outcome.absDrift,
        repaired: outcome.repaired ? 1 : 0,
        mode,
      };
    }

    for (;;) {
      if (limit !== undefined && scanned >= limit) break;
      const take = limit !== undefined ? Math.min(batchSize, limit - scanned) : batchSize;
      const employees = await this.prisma.employee.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
        take,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (employees.length === 0) break;

      for (const employee of employees) {
        scanned += 1;
        const outcome = await this.processEmployee(employee.id, mode, publish);
        if (outcome.kind === 'matched') matched += 1;
        if (outcome.kind === 'drifted') drifted += 1;
        if (outcome.kind === 'missing') missing += 1;
        if (outcome.negative) negative += 1;
        if (outcome.absDrift > maxAbsoluteDrift) maxAbsoluteDrift = outcome.absDrift;
        if (outcome.repaired) repaired += 1;
        if (limit !== undefined && scanned >= limit) break;
      }

      cursor = employees[employees.length - 1]?.id;
      if (employees.length < take) break;
    }

    if (drifted > 0) {
      recordInboxMetric('notification_inbox_drift_detected_total', drifted);
    }
    if (repaired > 0) {
      recordInboxMetric('notification_inbox_repair_total', repaired);
    }

    const report: InboxDryRunReport = {
      scanned,
      matched,
      drifted,
      missing,
      negative,
      maxAbsoluteDrift,
      repaired,
      mode,
    };
    this.logger.log(
      `Inbox reconcile ${mode}: scanned=${scanned} matched=${matched} drifted=${drifted} missing=${missing} negative=${negative} maxAbs=${maxAbsoluteDrift} repaired=${repaired}`,
    );
    return report;
  }

  private async processEmployee(
    employeeId: string,
    mode: 'dry-run' | 'repair',
    publish: boolean,
  ): Promise<{
    kind: 'matched' | 'drifted' | 'missing';
    absDrift: number;
    negative: boolean;
    repaired: boolean;
  }> {
    if (mode === 'dry-run') {
      const actual = await this.countUnread(employeeId);
      const storedRow = await this.prisma.notificationInboxState.findUnique({
        where: { employeeId },
        select: { unreadCount: true },
      });
      if (!storedRow) {
        return { kind: 'missing', absDrift: actual, negative: false, repaired: false };
      }
      const negative = storedRow.unreadCount < 0;
      if (storedRow.unreadCount === actual && !negative) {
        return { kind: 'matched', absDrift: 0, negative: false, repaired: false };
      }
      return {
        kind: 'drifted',
        absDrift: Math.abs(actual - storedRow.unreadCount),
        negative,
        repaired: false,
      };
    }

    // repair: advisory lock + re-count inside transaction
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employeeId}))`;
      const actual = await tx.inAppNotification.count({
        where: {
          recipientEmployeeId: employeeId,
          isRead: false,
          archivedAt: null,
        },
      });
      const storedRow = await tx.notificationInboxState.findUnique({
        where: { employeeId },
        select: { unreadCount: true },
      });
      if (!storedRow) {
        const updated = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
          INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
          VALUES (${employeeId}, ${actual}, 1, CURRENT_TIMESTAMP)
          ON CONFLICT (employee_id) DO UPDATE
          SET
            unread_count = EXCLUDED.unread_count,
            version = notification_inbox_state.version + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE notification_inbox_state.unread_count IS DISTINCT FROM EXCLUDED.unread_count
          RETURNING unread_count, version
        `;
        return {
          kind: 'missing' as const,
          absDrift: actual,
          negative: false,
          repaired: updated.length > 0,
          snapshot: updated[0]
            ? { unreadCount: Number(updated[0].unread_count), version: Number(updated[0].version) }
            : null,
        };
      }

      const negative = storedRow.unreadCount < 0;
      if (storedRow.unreadCount === actual && !negative) {
        return {
          kind: 'matched' as const,
          absDrift: 0,
          negative: false,
          repaired: false,
          snapshot: null,
        };
      }

      const updated = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
        UPDATE notification_inbox_state
        SET
          unread_count = ${actual},
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ${employeeId}
          AND unread_count IS DISTINCT FROM ${actual}
        RETURNING unread_count, version
      `;
      // If negative but count matches after abs, force bump
      if (updated.length === 0 && negative) {
        const forced = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
          UPDATE notification_inbox_state
          SET
            unread_count = ${actual},
            version = version + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE employee_id = ${employeeId}
          RETURNING unread_count, version
        `;
        return {
          kind: 'drifted' as const,
          absDrift: Math.abs(actual - storedRow.unreadCount),
          negative: true,
          repaired: forced.length > 0,
          snapshot: forced[0]
            ? { unreadCount: Number(forced[0].unread_count), version: Number(forced[0].version) }
            : null,
        };
      }

      return {
        kind: 'drifted' as const,
        absDrift: Math.abs(actual - storedRow.unreadCount),
        negative,
        repaired: updated.length > 0,
        snapshot: updated[0]
          ? { unreadCount: Number(updated[0].unread_count), version: Number(updated[0].version) }
          : null,
      };
    });

    if (result.repaired && result.snapshot && publish && this.realtimePublisher) {
      await this.realtimePublisher.publishSnapshot(employeeId, result.snapshot, {
        invalidateList: true,
      });
    }

    return {
      kind: result.kind,
      absDrift: result.absDrift,
      negative: result.negative,
      repaired: result.repaired,
    };
  }

  private async countUnread(employeeId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: {
        recipientEmployeeId: employeeId,
        isRead: false,
        archivedAt: null,
      },
    });
  }
}

function emptyReport(mode: 'dry-run' | 'repair'): InboxDryRunReport {
  return {
    scanned: 0,
    matched: 0,
    drifted: 0,
    missing: 0,
    negative: 0,
    maxAbsoluteDrift: 0,
    repaired: 0,
    mode,
  };
}
