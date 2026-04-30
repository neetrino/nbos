import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DriveModule } from '../drive/drive.module';
import { FinanceReportsModule } from '../finance/reports/reports.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuditModule, DriveModule, FinanceReportsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
