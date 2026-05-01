import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceSummaryService } from './summary.service';

@ApiTags('Finance / Summary')
@ApiBearerAuth()
@Controller('finance/summary')
export class FinanceSummaryController {
  constructor(private readonly financeSummaryService: FinanceSummaryService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get finance dashboard summary',
    description:
      'Includes workspace-wide `payrollRuns` from `GET /payroll-runs/stats` (all runs), independent of invoice date filters.',
  })
  async getDashboardSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeSummaryService.getDashboardSummary({ dateFrom, dateTo });
  }
}
