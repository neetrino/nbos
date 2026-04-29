import { Module } from '@nestjs/common';
import { PayrollRunsModule } from '../../payroll-runs/payroll-runs.module';
import { FinanceSummaryController } from './summary.controller';
import { FinanceSummaryService } from './summary.service';

@Module({
  imports: [PayrollRunsModule],
  controllers: [FinanceSummaryController],
  providers: [FinanceSummaryService],
  exports: [FinanceSummaryService],
})
export class FinanceSummaryModule {}
