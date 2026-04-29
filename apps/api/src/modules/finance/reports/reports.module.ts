import { Module } from '@nestjs/common';
import { FinanceReportsController } from './reports.controller';
import { FinanceReportsService } from './reports.service';

@Module({
  controllers: [FinanceReportsController],
  providers: [FinanceReportsService],
  exports: [FinanceReportsService],
})
export class FinanceReportsModule {}
