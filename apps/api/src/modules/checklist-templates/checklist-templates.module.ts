import { Module } from '@nestjs/common';
import { ChecklistInstancesController } from './checklist-instances.controller';
import { ChecklistTemplatesController } from './checklist-templates.controller';
import { ChecklistTemplatesService } from './checklist-templates.service';

@Module({
  controllers: [ChecklistTemplatesController, ChecklistInstancesController],
  providers: [ChecklistTemplatesService],
  exports: [ChecklistTemplatesService],
})
export class ChecklistTemplatesModule {}
