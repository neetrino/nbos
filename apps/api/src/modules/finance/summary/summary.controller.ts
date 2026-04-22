import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceSummaryService } from './summary.service';

@ApiTags('Finance / Summary')
@ApiBearerAuth()
@Controller('finance/summary')
export class FinanceSummaryController {
  constructor(private readonly financeSummaryService: FinanceSummaryService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get finance dashboard summary' })
  async getDashboardSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeSummaryService.getDashboardSummary({ dateFrom, dateTo });
  }
}
