import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CrmModule } from './modules/crm/crm.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FinanceModule } from './modules/finance/finance.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SupportModule } from './modules/support/support.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { BonusModule } from './modules/bonus/bonus.module';
import { AuditModule } from './modules/audit/audit.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { DriveModule } from './modules/drive/drive.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { AutomationModule } from './modules/automation/automation.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MessengerModule } from './modules/messenger/messenger.module';
import { PartnersModule } from './modules/partners/partners.module';
import { SystemListsModule } from './modules/system-lists/system-lists.module';
import { RolesModule } from './modules/roles/roles.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { EmployeeInterceptor } from './common/interceptors/employee.interceptor';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env.local',
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    DatabaseModule,
    AuthModule,
    EmployeesModule,
    CrmModule,
    ProjectsModule,
    ClientsModule,
    FinanceModule,
    TasksModule,
    SupportModule,
    ExpensesModule,
    BonusModule,
    AuditModule,
    CredentialsModule,
    DriveModule,
    NotificationModule,
    AutomationModule,
    SchedulerModule,
    PartnersModule,
    MessengerModule,
    SystemListsModule,
    RolesModule,
    DepartmentsModule,
    InvitationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EmployeeInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
