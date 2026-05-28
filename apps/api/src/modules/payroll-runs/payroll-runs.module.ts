import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollAllocationMatrixService } from './payroll-allocation-matrix.service';
import { PayrollRunsService } from './payroll-runs.service';

@Module({
  imports: [NotificationModule],
  controllers: [PayrollRunsController],
  providers: [PayrollRunsService, PayrollAllocationMatrixService],
  exports: [PayrollRunsService, PayrollAllocationMatrixService],
})
export class PayrollRunsModule {}
