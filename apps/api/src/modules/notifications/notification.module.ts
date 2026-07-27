import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationInboxReconcileService } from './notification-inbox-reconcile.service';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationInboxReconcileService],
  exports: [NotificationService, NotificationInboxReconcileService],
})
export class NotificationModule {}
