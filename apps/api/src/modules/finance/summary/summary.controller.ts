import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../../common/decorators';
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
      'Includes workspace-wide `payrollRuns` from `GET /payroll-runs/stats` only when the actor has FINANCE_SALARY VIEW ALL. Otherwise `payrollRuns` is null.',
  })
  async getDashboardSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeSummaryService.getDashboardSummary(user, { dateFrom, dateTo });
  }
}
