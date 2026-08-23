import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportSlaOrchestrationService } from './support-sla-orchestration.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [AuditModule, NotificationModule, TasksModule],
  controllers: [SupportController],
  providers: [SupportService, SupportSlaOrchestrationService],
  exports: [SupportService, SupportSlaOrchestrationService],
})
export class SupportModule {}
