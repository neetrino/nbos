import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollAllocationMatrixService } from './payroll-allocation-matrix.service';
import { PayrollRunsService } from './payroll-runs.service';
import { PayrollRunKpiResultService } from './payroll-run-kpi-result.service';

@Module({
  imports: [NotificationModule, AuditModule],
  controllers: [PayrollRunsController],
  providers: [PayrollRunsService, PayrollAllocationMatrixService, PayrollRunKpiResultService],
  exports: [PayrollRunsService, PayrollAllocationMatrixService, PayrollRunKpiResultService],
})
export class PayrollRunsModule {}
