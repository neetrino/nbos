import { Module } from '@nestjs/common';
import { CompanyPnlService } from './company-pnl.service';
import { FinanceReportsController } from './reports.controller';
import { FinanceReportsService } from './reports.service';

@Module({
  controllers: [FinanceReportsController],
  providers: [FinanceReportsService, CompanyPnlService],
  exports: [FinanceReportsService, CompanyPnlService],
})
export class FinanceReportsModule {}
