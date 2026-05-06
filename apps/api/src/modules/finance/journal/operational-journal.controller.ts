import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OperationalJournalService } from './operational-journal.service';

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

  @Get('cash-summary')
  @ApiOperation({ summary: 'Get cash movement aggregate from the operational journal' })
  getCashSummary(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.operationalJournal.getCashMovementSummary({ dateFrom, dateTo });
  }
}
