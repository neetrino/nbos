import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { MeController } from './me.controller';
import { MePreferencesController } from './me-preferences.controller';
import { EmployeesService } from './employees.service';
import { EmployeeInterfaceLocaleService } from './employee-interface-locale.service';
import { EmployeeWalletService } from './employee-wallet.service';
import { EmployeeOffboardingService } from './employee-offboarding.service';
import { EmployeeReactivationService } from './employee-reactivation.service';
import { EmployeeRoleAssignmentService } from './employee-role-assignment.service';
import { EmployeeSecurityAdminController } from './employee-security-admin.controller';
import { EmployeeSecurityAdminService } from './employee-security-admin.service';
import { DashboardModule } from '../dashboard/dashboard.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [DashboardModule, AuditModule, AuthModule, NotificationModule],
  controllers: [
    EmployeesController,
    EmployeeSecurityAdminController,
    MeController,
    MePreferencesController,
  ],
  providers: [
    EmployeesService,
    EmployeeInterfaceLocaleService,
    EmployeeWalletService,
    EmployeeOffboardingService,
    EmployeeReactivationService,
    EmployeeRoleAssignmentService,
    EmployeeSecurityAdminService,
  ],
  exports: [
    EmployeesService,
    EmployeeInterfaceLocaleService,
    EmployeeWalletService,
    EmployeeOffboardingService,
    EmployeeReactivationService,
    EmployeeRoleAssignmentService,
  ],
})
export class EmployeesModule {}
