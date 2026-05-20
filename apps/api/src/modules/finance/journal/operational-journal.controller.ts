import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  OperationalJournalService,
  type ManualAdjustmentInput,
} from './operational-journal.service';

@ApiTags('Finance / Operational Journal')
@ApiBearerAuth()
@Controller('finance/journal')
export class OperationalJournalController {
  constructor(private readonly operationalJournal: OperationalJournalService) {}

  @Get('periods')
  @ApiOperation({ summary: 'List finance posting periods' })
  listPostingPeriods() {
    return this.operationalJournal.listPostingPeriods();
  }

  @Post('periods/:monthKey/close')
  @ApiOperation({ summary: 'Close a finance posting period' })
  closePostingPeriod(@Param('monthKey') monthKey: string) {
    return this.operationalJournal.closePostingPeriod(monthKey);
  }

  @Get('entries')
  @ApiOperation({ summary: 'List operational journal entries (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'monthKey', required: false, description: 'YYYY-MM posting period filter' })
  @ApiQuery({ name: 'sourceType', required: false })
  listEntries(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('monthKey') monthKey?: string,
    @Query('sourceType') sourceType?: string,
  ) {
    return this.operationalJournal.listEntries({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      monthKey,
      sourceType,
    });
  }

  @Post('adjustments')
  @ApiOperation({
    summary: 'Post a manual adjustment in an open period (corrections after close)',
  })
  appendAdjustment(@Body() body: ManualAdjustmentInput) {
    return this.operationalJournal.appendManualAdjustment(body);
  }

  @Get('cash-summary')
  @ApiOperation({ summary: 'Get cash movement aggregate from the operational journal' })
  getCashSummary(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.operationalJournal.getCashMovementSummary({ dateFrom, dateTo });
  }
}
