import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationCommandService } from './notification-command.service';
import { NotificationInboxReconcileService } from './notification-inbox-reconcile.service';
import { NotificationEnqueueReconcileService } from './notification-enqueue-reconcile.service';
import { NotificationRuleCacheService } from './notification-rule-cache.service';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationRuleCacheService,
    NotificationCommandService,
    NotificationService,
    NotificationInboxReconcileService,
    NotificationEnqueueReconcileService,
  ],
  exports: [
    NotificationService,
    NotificationCommandService,
    NotificationInboxReconcileService,
    NotificationEnqueueReconcileService,
  ],
})
export class NotificationModule {}
