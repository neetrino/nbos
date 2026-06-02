import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { MeController } from './me.controller';
import { EmployeesService } from './employees.service';
import { EmployeeWalletService } from './employee-wallet.service';
import { EmployeeOffboardingService } from './employee-offboarding.service';
import { DashboardModule } from '../dashboard/dashboard.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [DashboardModule, AuditModule, NotificationModule],
  controllers: [EmployeesController, MeController],
  providers: [EmployeesService, EmployeeWalletService, EmployeeOffboardingService],
  exports: [EmployeesService, EmployeeWalletService, EmployeeOffboardingService],
})
export class EmployeesModule {}
