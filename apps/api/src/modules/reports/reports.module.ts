import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DriveModule } from '../drive/drive.module';
import { FinanceReportsModule } from '../finance/reports/reports.module';
import { ReportsController } from './reports.controller';
import { ReportsQueueService } from './reports-queue.service';
import { ReportsScheduleManagementService } from './reports-schedule-management.service';
import { ReportsScheduleRunnerService } from './reports-schedule-runner.service';
import { ReportsService } from './reports.service';

/** Producers + HTTP. BullMQ Worker lives in QueueWorkersModule. */
@Module({
  imports: [AuditModule, DriveModule, FinanceReportsModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsQueueService,
    ReportsScheduleRunnerService,
    ReportsScheduleManagementService,
  ],
  exports: [ReportsService, ReportsScheduleRunnerService, ReportsQueueService],
})
export class ReportsModule {}
