import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceReportsService } from './reports.service';

@ApiTags('Finance / Reports')
@ApiBearerAuth()
@Controller('finance/reports')
export class FinanceReportsController {
  constructor(private readonly financeReportsService: FinanceReportsService) {}

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
}
