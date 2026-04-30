import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DriveModule } from '../drive/drive.module';
import { FinanceReportsModule } from '../finance/reports/reports.module';
import { ReportsController } from './reports.controller';
import { ReportsExportWorker } from './reports-export.worker';
import { ReportsQueueService } from './reports-queue.service';
import { ReportsScheduleRunnerService } from './reports-schedule-runner.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuditModule, DriveModule, FinanceReportsModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsQueueService,
    ReportsExportWorker,
    ReportsScheduleRunnerService,
  ],
  exports: [ReportsService, ReportsScheduleRunnerService],
})
export class ReportsModule {}
