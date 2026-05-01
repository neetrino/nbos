import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CashFlowService } from './cash-flow.service';
import { CompanyPnlService } from './company-pnl.service';
import { ExpensePlanVsActualService } from './expense-plan-vs-actual.service';
import { FinanceReportsService } from './reports.service';
import { MrrSubscriptionRevenueService } from './mrr-subscription-revenue.service';
import { PayrollReportService } from './payroll-report.service';
import { ProjectPnlService } from './project-pnl.service';

@ApiTags('Finance / Reports')
@ApiBearerAuth()
@Controller('finance/reports')
export class FinanceReportsController {
  constructor(
    private readonly financeReportsService: FinanceReportsService,
    private readonly companyPnlService: CompanyPnlService,
    private readonly cashFlowService: CashFlowService,
    private readonly expensePlanVsActualService: ExpensePlanVsActualService,
    private readonly mrrSubscriptionRevenueService: MrrSubscriptionRevenueService,
    private readonly payrollReportService: PayrollReportService,
    private readonly projectPnlService: ProjectPnlService,
  ) {}

  @Get('definitions')
  @ApiOperation({
    summary: 'List Finance-owned report definitions v1',
    description:
      'Read-only catalog for Phase 3 Finance reports. Global report scheduling/catalog concerns stay in Phase 6.',
  })
  getDefinitions() {
    return this.financeReportsService.getDefinitions();
  }

  @Get('definitions/:id')
  @ApiOperation({ summary: 'Get a single Finance report definition' })
  getDefinition(@Param('id') id: string) {
    return this.financeReportsService.getDefinition(id);
  }

  @Get('company-pnl')
  @ApiOperation({
    summary: 'Get Company P&L v1 aggregate',
    description:
      'Cash-basis Phase 3 aggregate from incoming payments and actual expense payments. Payroll is exposed as a control subtotal to avoid double-counting materialized salary expenses.',
  })
  getCompanyPnl(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.companyPnlService.getReport({ dateFrom, dateTo });
  }

  @Get('cash-flow')
  @ApiOperation({
    summary: 'Get Cash Flow v1 aggregate',
    description:
      'Cash-driven Phase 3 aggregate with real movements, 30/60/90 day forecast and backlog debt separated from the current forecast.',
  })
  getCashFlow(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('asOf') asOf?: string,
  ) {
    return this.cashFlowService.getReport({ dateFrom, dateTo, asOf });
  }

  @Get('expense-plan-vs-actual')
  @ApiOperation({
    summary: 'Get Expense Plan vs Actual v1 aggregate',
    description:
      'Phase 3 aggregate comparing current expense plans, generated plan-linked expense cards and actual payments by category.',
  })
  getExpensePlanVsActual(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.expensePlanVsActualService.getReport({ dateFrom, dateTo });
  }

  @Get('mrr-subscription-revenue')
  @ApiOperation({
    summary: 'Get MRR / Subscription Revenue v1 aggregate',
    description:
      'Phase 3 aggregate for active MRR, subscription revenue paid via payments, and new/churned subscription movement.',
  })
  getMrrSubscriptionRevenue(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.mrrSubscriptionRevenueService.getReport({ dateFrom, dateTo });
  }

  @Get('payroll')
  @ApiOperation({
    summary: 'Get Payroll Report v1 aggregate',
    description:
      'Phase 3 aggregate for payroll payable, paid, remaining, salary-linked expense payments and payroll as percent of incoming revenue.',
  })
  getPayrollReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.payrollReportService.getReport({ dateFrom, dateTo });
  }

  @Get('project-pnl')
  @ApiOperation({
    summary: 'Get Project P&L v1 aggregate',
    description:
      'Cash-driven Phase 3 aggregate for project revenue, actual costs, net profit and margin from live payments and expense payments.',
  })
  getProjectPnl(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.projectPnlService.getReport({ dateFrom, dateTo });
  }
}
