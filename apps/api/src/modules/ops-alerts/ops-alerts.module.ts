import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { OpsJobFailureAlertService } from './ops-job-failure-alert.service';

@Module({
  imports: [NotificationModule],
  providers: [OpsJobFailureAlertService],
  exports: [OpsJobFailureAlertService],
})
export class OpsAlertsModule {}
