import { Module } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';
import { CompanyPnlService } from './company-pnl.service';
import { ExpensePlanVsActualService } from './expense-plan-vs-actual.service';
import { FinanceReportsController } from './reports.controller';
import { FinanceReportsService } from './reports.service';

@Module({
  controllers: [FinanceReportsController],
  providers: [
    FinanceReportsService,
    CompanyPnlService,
    CashFlowService,
    ExpensePlanVsActualService,
  ],
  exports: [FinanceReportsService, CompanyPnlService, CashFlowService, ExpensePlanVsActualService],
})
export class FinanceReportsModule {}
