import { Module } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';
import { CompanyPnlService } from './company-pnl.service';
import { FinanceReportsController } from './reports.controller';
import { FinanceReportsService } from './reports.service';

@Module({
  controllers: [FinanceReportsController],
  providers: [FinanceReportsService, CompanyPnlService, CashFlowService],
  exports: [FinanceReportsService, CompanyPnlService, CashFlowService],
})
export class FinanceReportsModule {}
