import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompanyPnlService } from './company-pnl.service';
import { FinanceReportsService } from './reports.service';

@ApiTags('Finance / Reports')
@ApiBearerAuth()
@Controller('finance/reports')
export class FinanceReportsController {
  constructor(
    private readonly financeReportsService: FinanceReportsService,
    private readonly companyPnlService: CompanyPnlService,
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
}
