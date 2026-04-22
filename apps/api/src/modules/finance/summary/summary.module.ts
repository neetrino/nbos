import { Module } from '@nestjs/common';
import { FinanceSummaryController } from './summary.controller';
import { FinanceSummaryService } from './summary.service';

@Module({
  controllers: [FinanceSummaryController],
  providers: [FinanceSummaryService],
  exports: [FinanceSummaryService],
})
export class FinanceSummaryModule {}
