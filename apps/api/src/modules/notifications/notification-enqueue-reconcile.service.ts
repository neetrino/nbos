import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isNotificationEnqueueReconcileEnabled } from './notification-command.flags';

import { recordNotificationMetric } from './notification-metrics';

const DEFAULT_LIMIT = 100;

/**
 * Recovers stuck PENDING notification jobs/deliveries after post-commit enqueue failures.
 * Full transactional outbox is deferred; this is the recoverable intermediate path.
 */
@Injectable()
export class NotificationEnqueueReconcileService {
  private readonly logger = new Logger(NotificationEnqueueReconcileService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async reconcilePending(limit = DEFAULT_LIMIT): Promise<{
    scannedJobs: number;
    scannedDeliveries: number;
  }> {
    if (!isNotificationEnqueueReconcileEnabled()) {
      this.logger.warn('Enqueue reconcile skipped (NOTIFICATION_ENQUEUE_RECONCILE_ENABLED off)');
      return { scannedJobs: 0, scannedDeliveries: 0 };
    }

    const pendingJobs = await this.prisma.notificationJob.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, dedupeKey: true, createdAt: true },
    });

    const pendingDeliveries = await this.prisma.notificationDelivery.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, jobId: true, channel: true, recipient: true },
    });

    recordNotificationMetric({
      name: 'notification_enqueue_pending_jobs',
      value: pendingJobs.length,
    });
    recordNotificationMetric({
      name: 'notification_enqueue_pending_deliveries',
      value: pendingDeliveries.length,
    });

    this.logger.log(
      `Enqueue reconcile scan jobs=${pendingJobs.length} deliveries=${pendingDeliveries.length}`,
    );

    for (const delivery of pendingDeliveries) {
      this.logger.warn(
        `PENDING delivery id=${delivery.id} job=${delivery.jobId} channel=${delivery.channel} recipient=${delivery.recipient}`,
      );
    }

    return {
      scannedJobs: pendingJobs.length,
      scannedDeliveries: pendingDeliveries.length,
    };
  }
}
