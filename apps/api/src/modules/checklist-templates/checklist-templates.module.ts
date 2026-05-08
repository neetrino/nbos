import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ChecklistInstancesController } from './checklist-instances.controller';
import { ChecklistTemplatesController } from './checklist-templates.controller';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { DeliveryStageChecklistRulesService } from './delivery-stage-checklist-rules.service';
import { DeliveryStageChecklistSyncService } from './delivery-stage-checklist-sync.service';

@Module({
  imports: [AuditModule],
  controllers: [ChecklistInstancesController, ChecklistTemplatesController],
  providers: [
    ChecklistTemplatesService,
    DeliveryStageChecklistRulesService,
    DeliveryStageChecklistSyncService,
  ],
  exports: [ChecklistTemplatesService, DeliveryStageChecklistSyncService],
})
export class ChecklistTemplatesModule {}
