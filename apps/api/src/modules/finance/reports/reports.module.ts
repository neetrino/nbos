import { Module } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';
import { CompanyPnlService } from './company-pnl.service';
import { ExpensePlanVsActualService } from './expense-plan-vs-actual.service';
import { FinanceReportsController } from './reports.controller';
import { FinanceReportsService } from './reports.service';
import { MrrSubscriptionRevenueService } from './mrr-subscription-revenue.service';

@Module({
  controllers: [FinanceReportsController],
  providers: [
    FinanceReportsService,
    CompanyPnlService,
    CashFlowService,
    ExpensePlanVsActualService,
    MrrSubscriptionRevenueService,
  ],
  exports: [
    FinanceReportsService,
    CompanyPnlService,
    CashFlowService,
    ExpensePlanVsActualService,
    MrrSubscriptionRevenueService,
  ],
})
export class FinanceReportsModule {}
